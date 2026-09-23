import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { App } from "~/App";
import type { AuthClient } from "~/modules/auth/auth-client";

const MEMBER = { name: "Annie Lin", email: "annie@example.com" };

function fakeClient(over: Partial<AuthClient> = {}): AuthClient {
  return {
    checkSession: vi.fn().mockResolvedValue({ ok: true, member: null }),
    signIn: vi.fn().mockResolvedValue({ ok: true, member: MEMBER }),
    signUp: vi.fn().mockResolvedValue({ ok: true, member: MEMBER }),
    signOut: vi.fn().mockResolvedValue({ ok: true }),
    ...over,
  };
}

const renderApp = (client: AuthClient) => {
  render(<App client={client} />);
  return userEvent.setup();
};

const emailBox = () => screen.getByLabelText("Email");
const passwordBox = () => screen.getByLabelText("Password");

describe("auth card", () => {
  it("shows the log in form when nobody is signed in", async () => {
    renderApp(fakeClient());

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
    expect(emailBox()).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("restores an active session straight to the welcome card", async () => {
    renderApp(fakeClient({ checkSession: vi.fn().mockResolvedValue({ ok: true, member: MEMBER }) }));

    expect(await screen.findByRole("heading", { name: "Annie Lin" })).toBeInTheDocument();
  });

  it("treats an unreachable server at boot as signed out", async () => {
    renderApp(fakeClient({ checkSession: vi.fn().mockResolvedValue({ ok: false, code: "network" }) }));

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("switches to sign up and reveals the name field", async () => {
    const user = renderApp(fakeClient());
    await screen.findByRole("heading", { name: "Log in" });

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(screen.getByRole("heading", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("keeps the email but clears the password when switching mode", async () => {
    const user = renderApp(fakeClient());
    await screen.findByRole("heading", { name: "Log in" });
    await user.type(emailBox(), "annie@example.com");
    await user.type(passwordBox(), "correct-horse");

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(emailBox()).toHaveValue("annie@example.com");
    expect(passwordBox()).toHaveValue("");
  });

  it("sends only email and password when logging in", async () => {
    const client = fakeClient();
    const user = renderApp(client);
    await screen.findByRole("heading", { name: "Log in" });
    await user.type(emailBox(), "annie@example.com");
    await user.type(passwordBox(), "correct-horse");

    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(client.signIn).toHaveBeenCalledWith({
        email: "annie@example.com",
        password: "correct-horse",
      }),
    );
  });

  it("sends name, email and password when creating an account", async () => {
    const client = fakeClient();
    const user = renderApp(client);
    await screen.findByRole("heading", { name: "Log in" });
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    await user.type(screen.getByLabelText("Name"), "Annie Lin");
    await user.type(emailBox(), "annie@example.com");
    await user.type(passwordBox(), "correct-horse");

    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(client.signUp).toHaveBeenCalledWith({
        name: "Annie Lin",
        email: "annie@example.com",
        password: "correct-horse",
      }),
    );
  });

  it("blocks submission and links the message when a field is invalid", async () => {
    const client = fakeClient();
    const user = renderApp(client);
    await screen.findByRole("heading", { name: "Log in" });
    await user.type(emailBox(), "not-an-email");
    await user.type(passwordBox(), "correct-horse");

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(client.signIn).not.toHaveBeenCalled();
    expect(emailBox()).toHaveAttribute("aria-invalid", "true");
    expect(emailBox()).toHaveAccessibleDescription("Enter a valid email address.");
  });

  it("shows a neutral message for bad credentials and clears only the password", async () => {
    const client = fakeClient({
      signIn: vi.fn().mockResolvedValue({ ok: false, code: "invalid_credentials" }),
    });
    const user = renderApp(client);
    await screen.findByRole("heading", { name: "Log in" });
    await user.type(emailBox(), "annie@example.com");
    await user.type(passwordBox(), "wrong-password");

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Email or password is incorrect.")).toBeInTheDocument();
    expect(emailBox()).toHaveValue("annie@example.com");
    expect(passwordBox()).toHaveValue("");
  });

  it("reports a duplicate email when signing up", async () => {
    const client = fakeClient({ signUp: vi.fn().mockResolvedValue({ ok: false, code: "email_taken" }) });
    const user = renderApp(client);
    await screen.findByRole("heading", { name: "Log in" });
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    await user.type(screen.getByLabelText("Name"), "Annie Lin");
    await user.type(emailBox(), "annie@example.com");
    await user.type(passwordBox(), "correct-horse");

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("An account already uses this email.")).toBeInTheDocument();
  });

  it("marks the submit control busy and refuses a second submit", async () => {
    let release!: () => void;
    const signIn = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ ok: true, member: MEMBER });
      }),
    );
    const user = renderApp(fakeClient({ signIn }));
    await screen.findByRole("heading", { name: "Log in" });
    await user.type(emailBox(), "annie@example.com");
    await user.type(passwordBox(), "correct-horse");

    const submit = screen.getByRole("button", { name: "Log in" });
    await user.click(submit);
    await waitFor(() => expect(submit).toHaveAttribute("aria-busy", "true"));
    expect(submit).toBeDisabled();

    release();
    await screen.findByRole("heading", { name: "Annie Lin" });
    expect(signIn).toHaveBeenCalledOnce();
  });

  it("renders a member name as text, never as markup", async () => {
    const hostile = { name: "<img src=x onerror=alert(1)>", email: "x@example.com" };
    renderApp(fakeClient({ checkSession: vi.fn().mockResolvedValue({ ok: true, member: hostile }) }));

    const heading = await screen.findByRole("heading", { name: hostile.name });

    expect(heading.querySelector("img")).toBeNull();
  });

  it("signs out back to the log in form", async () => {
    const client = fakeClient({ checkSession: vi.fn().mockResolvedValue({ ok: true, member: MEMBER }) });
    const user = renderApp(client);
    await screen.findByRole("heading", { name: "Annie Lin" });

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
    expect(client.signOut).toHaveBeenCalledOnce();
  });

  it("stays on the welcome card when signing out fails", async () => {
    const client = fakeClient({
      checkSession: vi.fn().mockResolvedValue({ ok: true, member: MEMBER }),
      signOut: vi.fn().mockResolvedValue({ ok: false }),
    });
    const user = renderApp(client);
    await screen.findByRole("heading", { name: "Annie Lin" });

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText(/couldn't reach the server/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Annie Lin" })).toBeInTheDocument();
  });

  it("gives every input a label and an autocomplete hint", async () => {
    const user = renderApp(fakeClient());
    await screen.findByRole("heading", { name: "Log in" });
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    for (const input of screen.getAllByRole("textbox")) {
      expect(input).toHaveAccessibleName();
      expect(input).toHaveAttribute("autocomplete");
    }
    expect(passwordBox()).toHaveAttribute("autocomplete", "new-password");
  });
});

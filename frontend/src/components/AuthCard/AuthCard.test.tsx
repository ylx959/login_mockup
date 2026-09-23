import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "@/App";
import * as motionConfig from "@/lib/motion";
import type { AuthClient } from "@/modules/auth/auth-client";

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
  render(
    <BrowserRouter>
      <App client={client} />
    </BrowserRouter>,
  );
  return userEvent.setup();
};

const emailBox = () => screen.getByLabelText("Email");
const passwordBox = () => screen.getByLabelText("Password");

/** 未登入時畫面是一顆收合的膠囊，點開才看得到表單。 */
const openCard = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole("button", { name: "touch me" }));
  await screen.findByRole("heading", { name: "Log in" });
};

describe("auth card", () => {
  beforeEach(() => window.history.replaceState({}, "", "/"));

  it("fades swapped title text without moving it", () => {
    expect(motionConfig.textVariants).toEqual({
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    });
  });

  it("reveals the form outward from its exact center", () => {
    expect(
      (motionConfig as Record<string, unknown>).contentRevealVariants,
    ).toEqual({
      hidden: { clipPath: "inset(50% 50% 50% 50%)" },
      visible: { clipPath: "inset(0% 0% 0% 0%)" },
    });
  });

  it("starts collapsed as a pill when nobody is signed in", async () => {
    renderApp(fakeClient());

    expect(await screen.findByRole("button", { name: "touch me" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("opens the log in form when the pill is tapped", async () => {
    const user = renderApp(fakeClient());

    await openCard(user);

    expect(emailBox()).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("restores an active session straight to the welcome card", async () => {
    window.history.replaceState({}, "", "/member");
    renderApp(fakeClient({ checkSession: vi.fn().mockResolvedValue({ ok: true, member: MEMBER }) }));

    expect(await screen.findByRole("heading", { name: "Annie Lin" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/member");
  });

  it("redirects an unauthenticated /member visit to /", async () => {
    window.history.replaceState({}, "", "/member");
    renderApp(fakeClient());

    expect(await screen.findByRole("button", { name: "touch me" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("treats an unreachable server at boot as signed out", async () => {
    renderApp(fakeClient({ checkSession: vi.fn().mockResolvedValue({ ok: false, code: "network" }) }));

    expect(await screen.findByRole("button", { name: "touch me" })).toBeInTheDocument();
  });

  it("switches to sign up and reveals the name field", async () => {
    const user = renderApp(fakeClient());
    await openCard(user);

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(screen.getByRole("heading", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("keeps the email but clears the password when switching mode", async () => {
    const user = renderApp(fakeClient());
    await openCard(user);
    await user.type(emailBox(), "annie@example.com");
    await user.type(passwordBox(), "correct-horse");

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(emailBox()).toHaveValue("annie@example.com");
    expect(passwordBox()).toHaveValue("");
  });

  it("sends only email and password when logging in", async () => {
    const client = fakeClient();
    const user = renderApp(client);
    await openCard(user);
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

  it("finishes hiding the login content before showing the welcome content", async () => {
    const user = renderApp(fakeClient());
    await openCard(user);
    await user.type(emailBox(), "annie@example.com");
    await user.type(passwordBox(), "correct-horse");

    await user.click(screen.getByRole("button", { name: "Log in" }));
    await screen.findByRole("heading", { name: "Annie Lin" });

    expect(screen.queryByRole("heading", { name: "Log in" })).not.toBeInTheDocument();
    expect(document.querySelectorAll("main section")).toHaveLength(1);
  });

  it("navigates to /member after a successful login", async () => {
    window.history.replaceState({}, "", "/");
    const user = renderApp(fakeClient());
    await openCard(user);
    await user.type(emailBox(), "annie@example.com");
    await user.type(passwordBox(), "correct-horse");

    await user.click(screen.getByRole("button", { name: "Log in" }));
    await screen.findByRole("heading", { name: "Annie Lin" });

    expect(window.location.pathname).toBe("/member");
  });

  it("sends name, email and password when creating an account", async () => {
    const client = fakeClient();
    const user = renderApp(client);
    await openCard(user);
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
    await openCard(user);
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
    await openCard(user);
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
    await openCard(user);
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
    await openCard(user);
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

  it("signs out back to the collapsed pill", async () => {
    const client = fakeClient({ checkSession: vi.fn().mockResolvedValue({ ok: true, member: MEMBER }) });
    const user = renderApp(client);
    await screen.findByRole("heading", { name: "Annie Lin" });

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("button", { name: "touch me" })).toBeInTheDocument();
    expect(client.signOut).toHaveBeenCalledOnce();
    expect(window.location.pathname).toBe("/");
  });

  it("removes the member page before showing touch me after sign out", async () => {
    const client = fakeClient({
      checkSession: vi.fn().mockResolvedValue({ ok: true, member: MEMBER }),
    });
    const user = renderApp(client);
    await screen.findByRole("heading", { name: "Annie Lin" });

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByRole("button", { name: "touch me" });

    expect(screen.queryByRole("heading", { name: "Annie Lin" })).not.toBeInTheDocument();
    expect(document.querySelector("main section")).toBeNull();
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
    await openCard(user);
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    for (const input of screen.getAllByRole("textbox")) {
      expect(input).toHaveAccessibleName();
      expect(input).toHaveAttribute("autocomplete");
    }
    expect(passwordBox()).toHaveAttribute("autocomplete", "new-password");
  });
});

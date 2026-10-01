import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GlassPanel } from "./GlassPanel";

describe("glass panel", () => {
  it("dismisses on a press outside the panel, not inside", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <p>outside</p>
        <GlassPanel onDismiss={onDismiss}>
          <input aria-label="Email" />
        </GlassPanel>
      </>,
    );

    await user.click(screen.getByLabelText("Email"));
    expect(onDismiss).not.toHaveBeenCalled();

    await user.click(screen.getByText("outside"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

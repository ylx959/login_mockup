/** 所有會被使用者讀到的字串。改文案不必進元件。 */

import type { AuthErrorCode } from "~/modules/auth/types";

export const brand = "YLX Lab";

export const modeCopy = {
  signIn: {
    title: "Log in",
    action: "Log in",
    switchPrompt: "Sign up",
    passwordAutocomplete: "current-password",
  },
  signUp: {
    title: "Sign up",
    action: "Create account",
    switchPrompt: "Log in",
    passwordAutocomplete: "new-password",
  },
} as const;

export const errorCopy: Record<AuthErrorCode, string> = {
  invalid_credentials: "Email or password is incorrect.",
  email_taken: "An account already uses this email.",
  invalid_input: "Check the highlighted fields and try again.",
  network: "We couldn't reach the server. Check your connection and try again.",
  server: "Something went wrong. Try again.",
};

export const validationCopy = {
  name: "Enter at least 2 characters for your name.",
  email: "Enter a valid email address.",
  password: "Use at least 8 characters for your password.",
} as const;

export const legal = {
  body:
    "For use by adults only (18 years of age and older). Keep out of reach of children and pets. In case of accidental ingestion contact our",
  linkLabel: "hotline",
  linkHref: "#hotline",
};

export const forgotLabel = "I forgot";
export const signOutLabel = "Sign out";
export const signingOutLabel = "Signing out…";
export const welcomeGreeting = "Welcome back,";

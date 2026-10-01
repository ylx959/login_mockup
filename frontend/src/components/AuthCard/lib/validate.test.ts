import { describe, expect, it } from "vitest";

import { hasErrors, validate } from "./validate";

const valid = { name: "Annie Lin", email: "annie@example.com", password: "correct-horse" };

describe("validate", () => {
  it("accepts a complete registration", () => {
    expect(validate(valid, "signUp")).toEqual({});
    expect(hasErrors(validate(valid, "signUp"))).toBe(false);
  });

  it("ignores the name when signing in", () => {
    expect(validate({ ...valid, name: "" }, "signIn")).toEqual({});
  });

  it("requires a name when signing up", () => {
    expect(validate({ ...valid, name: " A " }, "signUp")).toHaveProperty("name");
  });

  it("rejects a malformed email", () => {
    expect(validate({ ...valid, email: "nope" }, "signIn")).toHaveProperty("email");
  });

  it("rejects a short password", () => {
    expect(validate({ ...valid, password: "short" }, "signIn")).toHaveProperty("password");
  });

  it("reports every broken field at once", () => {
    const errors = validate({ name: "", email: "nope", password: "x" }, "signUp");

    expect(Object.keys(errors).sort()).toEqual(["email", "name", "password"]);
  });
});

/**
 * 送出前的檢查，純函式。規則對齊後端的 SignupRequest，
 * 不然使用者填得進去卻被伺服器擋成 422。
 */

import { validationCopy } from "@/data/copy";
import type { FieldName } from "@/data/fields";

import type { AuthMode } from "@/features/auth/machine";
import type { Registration } from "@/features/auth/types";

export type FieldErrors = Partial<Record<FieldName, string>>;

// 夠用就好，最終判準在後端的 EmailStr
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(values: Registration, mode: AuthMode): FieldErrors {
  const errors: FieldErrors = {};

  if (mode === "signUp" && values.name.trim().length < 2) {
    errors.name = validationCopy.name;
  }
  if (!EMAIL.test(values.email.trim())) {
    errors.email = validationCopy.email;
  }
  if (values.password.length < 8) {
    errors.password = validationCopy.password;
  }

  return errors;
}

export const hasErrors = (errors: FieldErrors): boolean => Object.keys(errors).length > 0;

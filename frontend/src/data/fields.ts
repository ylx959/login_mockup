/** 欄位的規格資料；元件只負責畫，不決定有哪些欄位、限制是什麼。 */

import type { AuthMode } from "~/modules/auth/auth-machine";

import { modeCopy } from "./copy";

export type FieldName = "name" | "email" | "password";
export type IconName = "user" | "at" | "key";

export type FieldSpec = {
  name: FieldName;
  label: string;
  placeholder: string;
  type: "text" | "email" | "password";
  icon: IconName;
  autoComplete: string;
  minLength?: number;
  maxLength: number;
};

// 長度上限對齊後端的 SignupRequest（name 50 / password 128），
// 不然使用者填得進去卻會被伺服器擋成 422。
const name: FieldSpec = {
  name: "name",
  label: "Name",
  placeholder: "name",
  type: "text",
  icon: "user",
  autoComplete: "name",
  minLength: 2,
  maxLength: 50,
};

const email: FieldSpec = {
  name: "email",
  label: "Email",
  placeholder: "email address",
  type: "email",
  icon: "at",
  autoComplete: "email",
  maxLength: 254,
};

const password = (mode: AuthMode): FieldSpec => ({
  name: "password",
  label: "Password",
  placeholder: "password",
  type: "password",
  icon: "key",
  autoComplete: modeCopy[mode].passwordAutocomplete,
  minLength: 8,
  maxLength: 128,
});

export function fieldsFor(mode: AuthMode): FieldSpec[] {
  return mode === "signUp" ? [name, email, password(mode)] : [email, password(mode)];
}

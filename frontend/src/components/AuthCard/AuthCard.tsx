import { useId, useState } from "react";

import { Field } from "~/components/Field/Field";
import { GlassPanel } from "~/components/GlassPanel/GlassPanel";
import { PillButton } from "~/components/PillButton/PillButton";
import { SubmitButton } from "~/components/SubmitButton/SubmitButton";
import { brand, errorCopy, forgotLabel, legal, modeCopy } from "~/data/copy";
import { fieldsFor, type FieldName } from "~/data/fields";
import type { AuthMode, AuthState } from "~/modules/auth/auth-machine";
import type { AuthActions } from "~/modules/auth/use-auth";
import { hasErrors, validate, type FieldErrors } from "~/modules/auth/validate";

import styles from "./AuthCard.module.css";

const EMPTY = { name: "", email: "", password: "" };

export type AuthCardProps = {
  state: AuthState;
  actions: AuthActions;
};

export function AuthCard({ state, actions }: AuthCardProps) {
  const titleId = useId();
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const copy = modeCopy[state.mode];
  const busy = state.status === "submitting";
  const serverError = state.error ? errorCopy[state.error] : null;

  const update = (name: FieldName) => (value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    // 使用者開始修正就把該欄的錯誤收掉
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const switchTo = (mode: AuthMode) => {
    setFieldErrors({});
    // 換模式保留 email，密碼不帶過去
    setValues((current) => ({ ...current, password: "" }));
    actions.setMode(mode);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const errors = validate(values, state.mode);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    await actions.submit(values);
    // 失敗時保留 email/name，只清密碼
    setValues((current) => ({ ...current, password: "" }));
  };

  return (
    <GlassPanel labelledBy={titleId}>
      <div className={styles.header}>
        <p className={styles.brand}>{brand}</p>
        <PillButton
          variant="quiet"
          disabled={busy}
          onClick={() => switchTo(state.mode === "signIn" ? "signUp" : "signIn")}
        >
          {copy.switchPrompt}
        </PillButton>
      </div>

      <h1 className={styles.title} id={titleId}>
        {copy.title}
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.fields}>
          {fieldsFor(state.mode).map((spec) => (
            <Field
              key={spec.name}
              spec={spec}
              value={values[spec.name]}
              onChange={update(spec.name)}
              error={fieldErrors[spec.name]}
              disabled={busy}
              trailing={
                spec.name === "password" && state.mode === "signIn" ? (
                  <PillButton variant="solid" compact disabled={busy}>
                    {forgotLabel}
                  </PillButton>
                ) : undefined
              }
            />
          ))}
        </div>

        <p className={styles.status} role="status" aria-live="polite">
          {serverError}
        </p>

        <div className={styles.actions}>
          <p className={styles.legal}>
            {legal.body}{" "}
            <a href={legal.linkHref}>{legal.linkLabel}</a>.
          </p>
          <SubmitButton label={copy.action} busy={busy} />
        </div>
      </form>
    </GlassPanel>
  );
}

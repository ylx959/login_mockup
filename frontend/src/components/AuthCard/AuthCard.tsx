import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { useState } from "react";

import { Field } from "~/components/Field/Field";
import { PillButton } from "~/components/PillButton/PillButton";
import { SubmitButton } from "~/components/SubmitButton/SubmitButton";
import { brand, errorCopy, modeCopy } from "~/data/copy";
import { fieldsFor, type FieldName } from "~/data/fields";
import type { AuthMode, AuthState } from "~/modules/auth/auth-machine";
import type { AuthActions } from "~/modules/auth/use-auth";
import {
  contentRevealVariants,
  contentSpring,
  instant,
  shellSpring,
  textVariants,
} from "~/lib/motion";
import { hasErrors, validate, type FieldErrors } from "~/modules/auth/validate";

import styles from "./AuthCard.module.css";

const EMPTY = { name: "", email: "", password: "" };

function TitleText({ children }: { children: string }) {
  const isPresent = useIsPresent();
  const reduced = useReducedMotion();

  return (
    <motion.span
      className={styles.titleText}
      aria-hidden={!isPresent}
      {...(reduced ? {} : { variants: textVariants })}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={reduced ? instant : contentSpring}
    >
      {children}
    </motion.span>
  );
}

export type AuthCardProps = {
  titleId: string;
  state: AuthState;
  actions: AuthActions;
};

export function AuthCard({ titleId, state, actions }: AuthCardProps) {
  const reduced = useReducedMotion();
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
    <motion.div
      className={styles.content}
      variants={contentRevealVariants}
      initial={reduced ? "visible" : "hidden"}
      animate="visible"
      transition={reduced ? instant : shellSpring}
    >
      {/* 內容與外殼同步，從正中心向四邊展開；不做整體淡入。 */}
      <div className={styles.header}>
        <p className={styles.brand}>{brand}</p>
        <PillButton
          variant="quiet"
          disabled={busy}
          onClick={() =>
            switchTo(state.mode === "signIn" ? "signUp" : "signIn")
          }
        >
          {copy.switchPrompt}
        </PillButton>
      </div>

      <motion.h1 layout="position" className={styles.title} id={titleId}>
        <AnimatePresence mode="popLayout" initial={false}>
          <TitleText key={state.mode}>{copy.title}</TitleText>
        </AnimatePresence>
      </motion.h1>

      <form onSubmit={handleSubmit} noValidate>
        {/* 欄位移除時就是直接移除，不留殘影；高度變化交給容器與卡片的 layout 彈簧。
          進場的淡入寫在 CSS，不依賴 Motion 跑完。 */}
        <motion.div layout className={styles.fields}>
          {fieldsFor(state.mode).map((spec) => (
            <div key={spec.name} className={styles.fieldSlot}>
              <Field
                spec={spec}
                value={values[spec.name]}
                onChange={update(spec.name)}
                error={fieldErrors[spec.name]}
                disabled={busy}
              />
            </div>
          ))}
        </motion.div>

        <motion.p
          layout="position"
          className={styles.status}
          role="status"
          aria-live="polite"
        >
          {serverError}
        </motion.p>

        <motion.div layout="position" className={styles.actions}>
          <SubmitButton label={copy.action} busy={busy} />
        </motion.div>
      </form>
    </motion.div>
  );
}

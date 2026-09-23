import { Icon } from "@/components/Icon/Icon";
import type { FieldSpec } from "@/data/fields";

import styles from "@/styles/Field.module.css";

export type FieldProps = {
  spec: FieldSpec;
  value: string;
  onChange(value: string): void;
  error?: string | undefined;
  disabled?: boolean;
};

export function Field({ spec, value, onChange, error, disabled = false }: FieldProps) {
  const id = `field-${spec.name}`;
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      {/* 視覺上只留 placeholder，label 保留給螢幕閱讀器 */}
      <label className="srOnly" htmlFor={id}>
        {spec.label}
      </label>

      <div className={`${styles.shell} ${error ? styles.invalid : ""}`}>
        <span className={styles.badge}>
          <Icon name={spec.icon} size={17} />
        </span>

        <input
          id={id}
          className={styles.input}
          name={spec.name}
          type={spec.type}
          placeholder={spec.placeholder}
          autoComplete={spec.autoComplete}
          value={value}
          disabled={disabled}
          required
          maxLength={spec.maxLength}
          {...(spec.minLength === undefined ? {} : { minLength: spec.minLength })}
          {...(error ? { "aria-invalid": true, "aria-describedby": errorId } : {})}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>

      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

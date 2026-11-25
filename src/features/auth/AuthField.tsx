/** A labeled text input for auth forms. Presentational only. Never
 * auto-capitalises, auto-corrects or spell-checks: server addresses,
 * usernames and passwords are typed exactly (iOS turned "cadence-demo" into
 * "Cadence", so the sign-in failed with a correct password). */
export function AuthField({
  label,
  type,
  value,
  onChange,
  autoComplete,
  inputMode,
  testId,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'numeric' | 'url';
  testId?: string;
}) {
  return (
    <label className="auth__field">
      <span className="auth__label">{label}</span>
      <input
        className="auth__input"
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        data-testid={testId}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

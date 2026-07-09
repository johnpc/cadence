/** A labeled text input for auth forms. Presentational only. */
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
        data-testid={testId}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

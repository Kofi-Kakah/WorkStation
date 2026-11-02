/**
 * Small accessible switch primitive.
 *
 * @param {{ checked: boolean, onChange: (checked: boolean) => void, label: string, disabled?: boolean }} props
 */
export function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="ui-toggle"
      data-checked={checked ? "true" : "false"}
      onClick={() => onChange(!checked)}
    >
      <span className="ui-toggle__thumb" />
    </button>
  );
}

export default Toggle;

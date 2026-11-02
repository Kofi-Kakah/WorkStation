/**
 * Accessible single-selection control for compact view or time-range filters.
 *
 * @param {{ options: Array<string|{label: string, value: string, disabled?: boolean}>, value: string, onChange: (value: string) => void, label: string }} props
 */
export function SegmentedControl({ options, value, onChange, label }) {
  return (
    <div className="ui-segmented" role="tablist" aria-label={label}>
      {options.map((option) => {
        const item =
          typeof option === "string"
            ? { label: option, value: option }
            : option;
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-disabled={item.disabled || undefined}
            disabled={item.disabled}
            data-selected={selected ? "true" : "false"}
            className="ui-segmented__item"
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;

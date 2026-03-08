import { useEffect, useRef, useState } from "react";

interface CustomSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function CustomSelect({
  id,
  label,
  value,
  onChange,
  options,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="input-field flex items-center justify-between text-left text-sm"
      >
        <span className="truncate">{selected?.label ?? "Pilih..."}</span>
        <span className={`text-slate-600 transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-slate-300 bg-white p-1 shadow-xl">
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm leading-tight ${
                  isActive
                    ? "bg-sky-100 font-semibold text-sky-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

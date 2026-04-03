"use client";

import { forwardRef, type InputHTMLAttributes, type ReactElement } from "react";

interface PickerFieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactElement;
  trailingIcon?: ReactElement;
}

export const PickerFieldInput = forwardRef<HTMLInputElement, PickerFieldInputProps>(
  function PickerFieldInput(
    { className = "", leadingIcon, trailingIcon, ...props },
    ref,
  ) {
    return (
      <div className="input-field flex min-h-12 items-center gap-3 border-transparent bg-[#f8f1e8]/70 px-3 py-2.5 shadow-none transition hover:bg-[#efe4d6] focus-within:border-[#e7ddd1] focus-within:ring-0">
        <input
          ref={ref}
          {...props}
          className={`min-w-0 flex-1 bg-transparent text-sm font-medium text-[#2f2a25] outline-none placeholder:text-[#a59584] ${className}`}
        />
      </div>
    );
  },
);

PickerFieldInput.displayName = "PickerFieldInput";

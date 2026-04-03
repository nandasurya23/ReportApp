"use client";

import { forwardRef } from "react";

interface PickerFieldButtonProps {
  value?: string;
  onClick?: () => void;
}

export const PickerFieldButton = forwardRef<HTMLButtonElement, PickerFieldButtonProps>(
  function PickerFieldButton({ value, onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className="input-field flex min-h-12 items-center justify-between gap-3 border-transparent bg-[#f8f1e8]/70 px-3 py-2.5 text-left shadow-none transition hover:bg-[#efe4d6] focus:border-[#e7ddd1]"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#2f2a25]">
          {value || "Pilih bulan"}
        </span>
      </button>
    );
  },
);

PickerFieldButton.displayName = "PickerFieldButton";

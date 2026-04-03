"use client";

import { useMemo } from "react";
import DatePicker from "react-datepicker";
import { id as idLocale } from "date-fns/locale/id";

import { PickerFieldButton } from "@/components/report/picker-field-button";
import { formatMonthYearLabel } from "@/lib/utils/date";
import { PickerSurface } from "@/components/report/picker-surface";

interface CustomMonthPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function CustomMonthPicker({ id, label, value, onChange }: CustomMonthPickerProps) {
  const selectedDate = useMemo(() => {
    if (!value) {
      return null;
    }
    const parsed = new Date(`${value}-01T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  const selectedLabel = useMemo(
    () => (selectedDate ? formatMonthYearLabel(value) : "Pilih bulan"),
    [selectedDate, value],
  );

  return (
    <PickerSurface
      controlId={id}
      label={label}
      selectedLabel={selectedLabel}
      helperText="Data, total, dan export mengikuti bulan ini."
    >
      <DatePicker
        id={id}
        selected={selectedDate}
        onChange={(date: Date | null) => {
          if (!date || Number.isNaN(date.getTime())) {
            onChange("");
            return;
          }
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          onChange(`${year}-${month}`);
        }}
        showMonthYearPicker
        dateFormat="MMMM yyyy"
        locale={idLocale}
        popperPlacement="bottom-start"
        showPopperArrow={false}
        popperClassName="report-datepicker-popper"
        calendarClassName="report-datepicker-calendar report-monthpicker-calendar"
        customInput={
          <PickerFieldButton
            aria-label={label}
            value={selectedLabel}
            onClick={() => undefined}
          />
        }
      />
    </PickerSurface>
  );
}

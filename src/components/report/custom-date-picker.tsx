"use client";

import DatePicker from "react-datepicker";
import { id as idLocale } from "date-fns/locale/id";

import { toISODateOnly } from "@/lib/utils/date";

interface CustomDatePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function CustomDatePicker({
  id,
  label,
  value,
  onChange,
}: CustomDatePickerProps) {
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <DatePicker
        id={id}
        selected={selectedDate}
        onChange={(date: Date | null) => onChange(date ? toISODateOnly(date) : "")}
        locale={idLocale}
        dateFormat="d MMMM yyyy"
        placeholderText="Pilih tanggal"
        popperClassName="report-datepicker-popper"
        calendarClassName="report-datepicker-calendar"
        className="input-field"
      />
    </div>
  );
}

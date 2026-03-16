"use client";

import { useCallback, useMemo, useState } from "react";
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
  const isValidDate = (date: Date | null | undefined): date is Date =>
    date instanceof Date && !Number.isNaN(date.getTime());
  const parsedSelectedDate = value ? new Date(`${value}T00:00:00`) : null;
  const selectedDate = isValidDate(parsedSelectedDate) ? parsedSelectedDate : null;
  const [rawInput, setRawInput] = useState(() =>
    selectedDate
      ? new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(selectedDate)
      : "",
  );
  const [inputError, setInputError] = useState("");
  const [isManualEditing, setIsManualEditing] = useState(false);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const monthMap = useMemo(
    () =>
      new Map<string, number>([
        ["januari", 0],
        ["februari", 1],
        ["maret", 2],
        ["april", 3],
        ["mei", 4],
        ["juni", 5],
        ["juli", 6],
        ["agustus", 7],
        ["september", 8],
        ["oktober", 9],
        ["november", 10],
        ["desember", 11],
      ]),
    [],
  );

  const formatDisplayDate = useCallback(
    (date: Date | null) => (isValidDate(date) ? formatter.format(date) : ""),
    [formatter],
  );

  const parseIndonesianDate = useCallback(
    (text: string): Date | null => {
      const normalized = text.trim().toLowerCase();
      const match = normalized.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i);
      if (!match) {
        return null;
      }
      const day = Number(match[1]);
      const month = monthMap.get(match[2]);
      const year = Number(match[3]);
      if (!Number.isFinite(day) || !Number.isFinite(year) || month === undefined) {
        return null;
      }
      const parsed = new Date(year, month, day);
      if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month ||
        parsed.getDate() !== day
      ) {
        return null;
      }
      return parsed;
    },
    [monthMap],
  );

  const commitManualInput = useCallback(() => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      setInputError("");
      setIsManualEditing(false);
      onChange("");
      return;
    }
    const parsed = parseIndonesianDate(trimmed);
    if (!parsed) {
      setInputError("Format tanggal tidak valid. Contoh: 1 Maret 2026");
      return;
    }
    const nextIso = toISODateOnly(parsed);
    setInputError("");
    setIsManualEditing(false);
    onChange(nextIso);
    setRawInput(formatDisplayDate(parsed));
  }, [formatDisplayDate, onChange, parseIndonesianDate, rawInput]);

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <DatePicker
        id={id}
        selected={selectedDate}
        onChange={(date: Date | null) => {
          if (isManualEditing) {
            return;
          }
          setInputError("");
          setIsManualEditing(false);
          if (!isValidDate(date)) {
            setRawInput("");
            onChange("");
            return;
          }
          const nextIso = toISODateOnly(date);
          onChange(nextIso);
          setRawInput(formatDisplayDate(date));
        }}
        onSelect={(date: Date | null) => {
          if (!isValidDate(date)) {
            return;
          }
          setInputError("");
          setIsManualEditing(false);
          const nextIso = toISODateOnly(date);
          onChange(nextIso);
          setRawInput(formatDisplayDate(date));
        }}
        onChangeRaw={(event) => {
          if (!event) {
            return;
          }
          setIsManualEditing(true);
          const nextValue = (event.target as HTMLInputElement).value;
          setRawInput(nextValue);
          if (inputError) {
            setInputError("");
          }
        }}
        onBlur={() => {
          commitManualInput();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitManualInput();
          }
        }}
        onCalendarOpen={() => {
          if (!isManualEditing) {
            setRawInput(formatDisplayDate(selectedDate));
          }
        }}
        onCalendarClose={() => {
          if (!isManualEditing) {
            setRawInput(formatDisplayDate(selectedDate));
          }
        }}
        locale={idLocale}
        dateFormat="d MMMM yyyy"
        placeholderText="Contoh: 1 Maret 2026"
        popperPlacement="bottom-start"
        showPopperArrow={false}
        popperClassName="report-datepicker-popper"
        calendarClassName="report-datepicker-calendar"
        className="input-field min-h-11 text-base sm:min-h-10 sm:text-sm"
        value={isManualEditing ? rawInput : formatDisplayDate(selectedDate)}
      />
      {inputError && <p className="mt-1 text-xs text-red-600">{inputError}</p>}
    </div>
  );
}

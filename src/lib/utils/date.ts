const WITA_TIME_ZONE = "Asia/Makassar";

export function formatDateWITA(
  date: Date = new Date(),
  locale = "id-ID",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: WITA_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function toISODateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatISODateToLongID(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function getWeekOfMonth(isoDate: string): number {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return 1;
  }
  const year = parsed.getFullYear();
  const month = parsed.getMonth();
  const dayOfMonth = parsed.getDate();

  const firstDay = new Date(year, month, 1);
  const firstWeekdayMondayBased = (firstDay.getDay() + 6) % 7; // Monday=0 ... Sunday=6

  return Math.floor((firstWeekdayMondayBased + dayOfMonth - 1) / 7) + 1;
}

export function getWeekCountInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1);
  const firstWeekdayMondayBased = (firstDay.getDay() + 6) % 7; // Monday=0 ... Sunday=6
  return Math.ceil((firstWeekdayMondayBased + daysInMonth) / 7);
}

export interface DateRange {
  from: string;
  to: string;
  preset: string;
}

export const DATE_PRESETS: Array<{ value: string; label: string }> = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "mtd", label: "Month to date" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All time" },
];

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const cairoCalendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
});

function cairoDay(value: Date) {
  const parts = cairoCalendar.formatToParts(value);
  const part = (type: string) => parts.find((value) => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function startOfCairoDay(day: string) {
  const midnight = new Date(`${day}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(midnight.getTime()) || toIso(midnight) !== day) {
    throw new Error("Invalid report date");
  }
  // Find the first instant in the Cairo calendar day. Searching the date
  // boundary handles skipped midnight and repeated evening hours at DST
  // changes without assuming a fixed offset or a 24-hour local day.
  let lower = midnight.getTime() - 36 * 60 * 60 * 1000;
  let upper = midnight.getTime() + 36 * 60 * 60 * 1000;
  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2);
    if (cairoDay(new Date(middle)) < day) lower = middle + 1;
    else upper = middle;
  }
  return new Date(lower).toISOString();
}

export function cairoTimestampRange(from: string, to: string) {
  const nextDay = new Date(`${to}T00:00:00Z`);
  // Validate both dates before calculating the exclusive calendar boundary.
  const start = startOfCairoDay(from);
  startOfCairoDay(to);
  if (from > to) throw new Error("Invalid report date range");
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return { start, endExclusive: startOfCairoDay(toIso(nextDay)) };
}

export function resolveRange(preset: string | undefined, now = new Date()): DateRange {
  const today = cairoDay(now);
  // Shift calendar days in UTC after resolving Cairo's date, avoiding host
  // timezone and daylight-saving changes when calculating report boundaries.
  const calendarDay = new Date(`${today}T00:00:00Z`);
  const selected = preset ?? "30d";

  switch (selected) {
    case "90d": {
      const from = new Date(calendarDay);
      from.setUTCDate(from.getUTCDate() - 90);
      return { from: toIso(from), to: today, preset: "90d" };
    }
    case "mtd": {
      const from = new Date(Date.UTC(calendarDay.getUTCFullYear(), calendarDay.getUTCMonth(), 1));
      return { from: toIso(from), to: today, preset: "mtd" };
    }
    case "ytd": {
      const from = new Date(Date.UTC(calendarDay.getUTCFullYear(), 0, 1));
      return { from: toIso(from), to: today, preset: "ytd" };
    }
    case "all":
      return { from: "1970-01-01", to: today, preset: "all" };
    case "30d":
    default: {
      const from = new Date(calendarDay);
      from.setUTCDate(from.getUTCDate() - 30);
      return { from: toIso(from), to: today, preset: "30d" };
    }
  }
}

export function formatRangeLabel(range: DateRange): string {
  if (range.preset === "all") return "All time";
  const preset = DATE_PRESETS.find((p) => p.value === range.preset);
  return preset?.label ?? `${range.from} → ${range.to}`;
}

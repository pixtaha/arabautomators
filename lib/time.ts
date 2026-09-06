// Day/week/month boundaries computed in Africa/Cairo -- the one timezone
// convention already established in this codebase (SessionVideoHero formats
// live-class times in Cairo time). No date library is installed anywhere in
// this project, so this is done with native Intl instead of adding one.
//
// Week starts Monday (ISO-8601). If this cohort actually runs a Sat-Fri
// week, change WEEKDAY_INDEX's role below -- everything else is unaffected.

const CAIRO_TZ = "Africa/Cairo";

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function cairoOffsetMsAt(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const cairoWallClockAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return cairoWallClockAsUtc - at.getTime();
}

function cairoTodayParts(at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")), weekday: get("weekday") };
}

// The real UTC instant of Cairo-local midnight on the given calendar date.
// Samples the Cairo/UTC offset at local noon of that date (rather than
// "now") so this stays correct for a boundary date on the other side of a
// DST transition from today.
function cairoMidnightUtc(year: number, month: number, day: number): Date {
  const noonGuess = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const offsetMs = cairoOffsetMsAt(noonGuess);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMs);
}

export type PointsRange = "day" | "week" | "month" | "all";

export const POINTS_RANGES: PointsRange[] = ["day", "week", "month", "all"];

// The UTC instant a `created_at >= start` filter should use for this range,
// or null for "all" (no filter).
export function getRangeStart(range: PointsRange): Date | null {
  if (range === "all") return null;

  const { year, month, day, weekday } = cairoTodayParts(new Date());

  if (range === "day") return cairoMidnightUtc(year, month, day);

  if (range === "week") {
    const daysSinceMonday = (WEEKDAY_INDEX[weekday] + 6) % 7;
    const mondayCalendarDay = new Date(Date.UTC(year, month - 1, day) - daysSinceMonday * 86_400_000);
    return cairoMidnightUtc(mondayCalendarDay.getUTCFullYear(), mondayCalendarDay.getUTCMonth() + 1, mondayCalendarDay.getUTCDate());
  }

  return cairoMidnightUtc(year, month, 1);
}

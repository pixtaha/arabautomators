// Converts a plain "YYYY-MM-DD" date (as produced by an <input type="date">)
// into the UTC instant for the start or end of that calendar day in Cairo
// local time -- NOT the UTC instant `new Date("YYYY-MM-DD")` would give you,
// which the JS spec always parses as UTC midnight regardless of anyone's
// timezone. Used by the Task Board admin form so a task's start_at/end_at
// actually aligns with the admin's own calendar day.
//
// Deliberately not a hardcoded +2/+3 offset: Egypt's DST rules have changed
// more than once in recent years (abolished in 2014-2015, a one-off summer
// experiment in 2023, and the currently-installed tzdata models a
// recurring seasonal DST again -- Africa/Cairo is UTC+2 in winter and
// UTC+3 in summer as of this writing). Computing the offset from the
// platform's own Intl/tzdata via getTimeZoneOffsetMinutes() means this
// stays correct whenever that data is updated, without a code change.
//
// No external timezone library: Intl.DateTimeFormat with timeZone is
// sufficient for this single conversion and keeps the dependency footprint
// down. Client-safe (no "server-only" import) -- unlike lib/data/taskBoard.ts,
// this has to be importable from CreateTaskBoardTaskForm.tsx ("use client").

const CAIRO_TIME_ZONE = "Africa/Cairo";

// How far ahead of UTC `timeZone`'s wall clock reads at the given instant,
// in minutes (positive east of UTC, e.g. +180 for Cairo in summer DST).
function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  // The timezone's wall-clock reading, reinterpreted as if it were itself
  // a UTC timestamp -- comparing that against the real instant gives the
  // offset directly.
  const wallClockAsUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return (wallClockAsUtc - date.getTime()) / 60_000;
}

// Two-pass correction (standard technique for "wall clock in zone X" ->
// UTC): the first pass's offset is looked up at a UTC-guess instant that
// may itself be off by the very offset we're solving for, so a second
// pass re-derives the offset at the corrected instant. Only matters right
// at a DST transition boundary; harmless otherwise since Cairo's offset
// doesn't change within the same day at these hours.
function cairoStartOfDayInstant(year: number, month: number, day: number): number {
  const naiveUtcGuess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const offset1 = getTimeZoneOffsetMinutes(CAIRO_TIME_ZONE, new Date(naiveUtcGuess));
  const adjusted = naiveUtcGuess - offset1 * 60_000;
  const offset2 = getTimeZoneOffsetMinutes(CAIRO_TIME_ZONE, new Date(adjusted));
  return naiveUtcGuess - offset2 * 60_000;
}

/**
 * `dateStr` is a plain "YYYY-MM-DD" string. Returns the ISO UTC instant for
 * the start of that day in Cairo local time, or -- with `endOfDay: true` --
 * the very last millisecond of that day in Cairo local time (computed as
 * "1ms before the next day's Cairo midnight", not "23:59:59.999 minus the
 * offset", to avoid whole-second rounding drift in the latter).
 */
export function cairoDateStringToUtcInstant(dateStr: string, endOfDay = false): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const startInstant = cairoStartOfDayInstant(year, month, day);
  if (!endOfDay) return new Date(startInstant).toISOString();

  // Date.UTC normalizes an out-of-range day (e.g. day 31 in a 30-day
  // month, or day 32 in December) into the correct next month/year.
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextStartInstant = cairoStartOfDayInstant(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
  return new Date(nextStartInstant - 1).toISOString();
}

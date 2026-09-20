import type { Hours } from "./types";

export const DEFAULT_HOURS: Hours = {
  tz: "America/Los_Angeles",
  days: {
    sun: null,
    mon: "10:00-18:00",
    tue: "10:00-18:00",
    wed: "10:00-18:00",
    thu: "10:00-18:00",
    fri: "10:00-18:00",
    sat: "10:00-16:00",
  },
};

export const FOOD_HOURS: Hours = {
  tz: "America/Los_Angeles",
  days: {
    sun: "11:00-20:00",
    mon: "11:00-20:00",
    tue: "11:00-20:00",
    wed: "11:00-20:00",
    thu: "11:00-20:00",
    fri: "11:00-21:00",
    sat: "11:00-21:00",
  },
};

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function parseHours(json: string): Hours {
  try {
    const parsed = JSON.parse(json) as Hours;
    if (!parsed?.days) return DEFAULT_HOURS;
    return parsed;
  } catch {
    return DEFAULT_HOURS;
  }
}

export function isOpenAt(hours: Hours, date: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: hours.tz || "America/Los_Angeles",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const weekdayRaw = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const key = weekdayRaw.slice(0, 3).toLowerCase();
  const window = hours.days[key] ?? null;
  if (!window) return false;

  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const now = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  const [start, end] = window.split("-");
  if (!start || !end) return false;
  return now >= start && now < end;
}

export function hoursLabel(hours: Hours): string {
  const openDays = WEEKDAYS.filter((d) => hours.days[d]);
  if (openDays.length === 0) return "Hours on request";
  const first = hours.days[openDays[0]!];
  return first ? `In-person ${first}` : "Hours on request";
}

export function weekdayKey(date: Date, tz = "America/Los_Angeles"): string {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  })
    .format(date)
    .slice(0, 3)
    .toLowerCase();
  return weekday;
}

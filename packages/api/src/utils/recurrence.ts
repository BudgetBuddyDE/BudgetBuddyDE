import type {TExecutionPlan} from '../types/recurringPayment.type';

export interface IRecurrenceSchedule {
  executionPlan: TExecutionPlan;
  startsOn: string;
}

interface IDateParts {
  year: number;
  month: number;
  day: number;
}

const DAY_MS = 86_400_000;
const dayIntervals: Partial<Record<TExecutionPlan, number>> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
};
const monthIntervals: Partial<Record<TExecutionPlan, number>> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

function parseDateOnly(value: string): IDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new RangeError(`Invalid date-only value: ${value}`);

  const parts = {year: Number(match[1]), month: Number(match[2]), day: Number(match[3])};
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (
    date.getUTCFullYear() !== parts.year ||
    date.getUTCMonth() !== parts.month - 1 ||
    date.getUTCDate() !== parts.day
  ) {
    throw new RangeError(`Invalid date-only value: ${value}`);
  }
  return parts;
}

function toEpochDay(parts: IDateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_MS;
}

function formatDateOnly(parts: IDateParts): string {
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function fromEpochDay(epochDay: number): IDateParts {
  const date = new Date(epochDay * DAY_MS);
  return {year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate()};
}

function anchoredMonthDate(start: IDateParts, occurrenceIndex: number, intervalMonths: number): IDateParts {
  const absoluteMonth = start.year * 12 + start.month - 1 + occurrenceIndex * intervalMonths;
  const year = Math.floor(absoluteMonth / 12);
  const monthIndex = absoluteMonth % 12;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return {year, month: monthIndex + 1, day: Math.min(start.day, lastDay)};
}

export function nextOccurrenceOnOrAfter(schedule: IRecurrenceSchedule, referenceDate: string): string {
  const start = parseDateOnly(schedule.startsOn);
  const reference = parseDateOnly(referenceDate);
  const startEpochDay = toEpochDay(start);
  const referenceEpochDay = toEpochDay(reference);
  if (referenceEpochDay <= startEpochDay) return schedule.startsOn;

  const dayInterval = dayIntervals[schedule.executionPlan];
  if (dayInterval !== undefined) {
    const elapsedDays = referenceEpochDay - startEpochDay;
    return formatDateOnly(fromEpochDay(startEpochDay + Math.ceil(elapsedDays / dayInterval) * dayInterval));
  }

  const monthInterval = monthIntervals[schedule.executionPlan];
  if (monthInterval === undefined) throw new RangeError(`Invalid execution plan: ${schedule.executionPlan}`);

  const elapsedMonths = (reference.year - start.year) * 12 + reference.month - start.month;
  let occurrenceIndex = Math.max(0, Math.floor(elapsedMonths / monthInterval));
  let candidate = anchoredMonthDate(start, occurrenceIndex, monthInterval);
  if (toEpochDay(candidate) < referenceEpochDay) {
    occurrenceIndex += 1;
    candidate = anchoredMonthDate(start, occurrenceIndex, monthInterval);
  }
  return formatDateOnly(candidate);
}

export function listOccurrenceDates(schedule: IRecurrenceSchedule, fromDate: string, toDate: string): string[] {
  const fromEpochDayValue = toEpochDay(parseDateOnly(fromDate));
  const toEpochDayValue = toEpochDay(parseDateOnly(toDate));
  if (fromEpochDayValue > toEpochDayValue) return [];

  const occurrences: string[] = [];
  let occurrence = nextOccurrenceOnOrAfter(schedule, fromDate);
  while (toEpochDay(parseDateOnly(occurrence)) <= toEpochDayValue) {
    occurrences.push(occurrence);
    const followingDay = formatDateOnly(fromEpochDay(toEpochDay(parseDateOnly(occurrence)) + 1));
    occurrence = nextOccurrenceOnOrAfter(schedule, followingDay);
  }
  return occurrences;
}

export function isOccurrenceDate(schedule: IRecurrenceSchedule, date: string): boolean {
  return nextOccurrenceOnOrAfter(schedule, date) === date;
}

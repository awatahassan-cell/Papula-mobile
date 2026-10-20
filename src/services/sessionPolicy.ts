import { ParentSettings } from './types';

export const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const validClock = (value: unknown): value is string => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const minuteOf = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
export function bedtimeActive(settings: Pick<ParentSettings, 'bedtimeLockEnabled' | 'bedtimeStart' | 'bedtimeEnd'>, now: Date): boolean {
  if (!settings.bedtimeLockEnabled) return false;
  const start = minuteOf(validClock(settings.bedtimeStart) ? settings.bedtimeStart : '20:00');
  const end = minuteOf(validClock(settings.bedtimeEnd) ? settings.bedtimeEnd : '07:00');
  const minute = now.getHours() * 60 + now.getMinutes();
  if (start === end) return false; // invalid/equal windows must not lock children out all day
  return start < end ? minute >= start && minute < end : minute >= start || minute < end;
}
export function dailyLimitSeconds(settings: Pick<ParentSettings, 'dailyLimitMinutes'>): number {
  return Math.max(60, Math.min(180 * 60, (Number.isFinite(settings.dailyLimitMinutes) ? settings.dailyLimitMinutes : 30) * 60));
}
/** Split a foreground interval at local midnight, including daylight-saving changes. */
export function addScreenTime(log: Record<string, number>, from: number, to: number, limit: number): Record<string, number> {
  const result = { ...log };
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return result;
  let cursor = from;
  while (cursor < to) {
    const date = new Date(cursor), key = dayKey(date);
    const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
    const end = Math.min(to, midnight);
    result[key] = Math.min(limit, Math.max(0, Number(result[key]) || 0) + (end - cursor) / 1000);
    cursor = end;
  }
  return Object.fromEntries(Object.keys(result).sort().slice(-28).map(key => [key, result[key]]));
}

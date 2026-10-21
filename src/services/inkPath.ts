import { StrokePoint } from './types';

/** Rounded midpoint curves stay inside the sampled stroke's bounds; raw points remain untouched for scoring. */
export function inkPath(points: readonly StrokePoint[]): string {
  if (!points.length) return '';
  const xy = (p: StrokePoint) => `${p.x} ${p.y}`;
  let path = `M ${xy(points[0])}`;
  if (points.length === 2) return `${path} L ${xy(points[1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], next = points[i + 1];
    path += ` Q ${xy(p)} ${(p.x + next.x) / 2} ${(p.y + next.y) / 2}`;
  }
  if (points.length > 2) path += ` L ${xy(points[points.length - 1])}`;
  return path;
}

/** Keep every accepted sample, but publish at most once per display frame. Finish/clear cancels stale frames. */
export function inkFrames(publish: () => void, request: (fn: () => void) => number, cancel: (id: number) => void) {
  let pending: number | null = null;
  return {
    schedule() { if (pending === null) pending = request(() => { pending = null; publish(); }); },
    cancel() { if (pending !== null) cancel(pending); pending = null; },
  };
}

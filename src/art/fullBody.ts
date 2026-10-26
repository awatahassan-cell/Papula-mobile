/**
 * Full-body versions of the animals that were drawn as heads only, in the same style as the original Papula characters:
 * a soft ground shadow, a body with a belly, feet and little arms, and the head drawing scaled on top.
 */
const LINE = 'stroke="#39334c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
const inside = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

export interface BodySpec { fur: string; belly: string; feet?: string; }
export function standing(headSvg: string, { fur, belly, feet = fur }: BodySpec): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="90" rx="28" ry="4" fill="#39334c" opacity=".09"/>`
    + `<ellipse cx="50" cy="72" rx="18" ry="19" fill="${fur}" ${LINE}/><ellipse cx="50" cy="73" rx="10" ry="13" fill="${belly}"/>`
    + `<ellipse cx="37" cy="87" rx="10" ry="5" fill="${feet}" ${LINE}/><ellipse cx="63" cy="87" rx="10" ry="5" fill="${feet}" ${LINE}/>`
    + `<path d="M34 65 Q25 59 27 68 L34 76 M66 65 Q75 59 73 68 L66 76" fill="${fur}" ${LINE}/>`
    + `<g transform="translate(14 -1) scale(.72)">${inside(headSvg)}</g></svg>`;
}

/** Which head drawings get a body, and in which colours. Horses, snakes, fish and birds are already whole animals. */
export const BODIES: Record<string, BodySpec> = {
  '🐘': { fur: '#c3cbe3', belly: '#e6eaf5' },
  '🐄': { fur: '#ffffff', belly: '#f1ecff' },
  '🐑': { fur: '#f4f1ff', belly: '#ffffff' },
  '🐥': { fur: '#ffe066', belly: '#fff4b3', feet: '#ffb84d' },
  '🐔': { fur: '#ffffff', belly: '#f3f0ff', feet: '#ffb84d' },
  '🐓': { fur: '#ffffff', belly: '#f3f0ff', feet: '#ffb84d' },
};
export function fullBodyPictures(pictures: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(BODIES).filter(([key]) => pictures[key]).map(([key, spec]) => [key, standing(pictures[key], spec)]));
}

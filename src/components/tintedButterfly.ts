import { BUTTERFLY_MOODS, Mood } from './butterflyMoods';

type Art = { wings: string; body: string };
const cache = new Map<string, Art>();

function rotate(hex: string, degrees: number): string {
  const value = hex.length === 4 ? '#' + [...hex.slice(1)].map(c => c + c).join('') : hex;
  const r = parseInt(value.slice(1, 3), 16) / 255, g = parseInt(value.slice(3, 5), 16) / 255, b = parseInt(value.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  const hue = (((h + degrees) % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((hue / 60) % 2) - 1)), m = l - c / 2;
  const [r1, g1, b1] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r1, g1, b1].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
// Yellow head/body shades and the cream spots keep their colour; only the purple, pink, blue and green wing parts are recoloured.
const KEEP = new Set(['#fff4d7', '#ffe68a', '#f5a83b', '#ffc74c']);
/** Locked butterflies: every colour becomes a light grey of about the same brightness, so only the outline of the shape shows. */
function grey(hex: string): string {
  const luma = 0.3 * parseInt(hex.slice(1, 3), 16) + 0.59 * parseInt(hex.slice(3, 5), 16) + 0.11 * parseInt(hex.slice(5, 7), 16);
  const v = Math.round(150 + (luma / 255) * 90).toString(16).padStart(2, '0');
  return `#${v}${v}${Math.min(255, parseInt(v, 16) + 8).toString(16).padStart(2, '0')}`;
}

/**
 * A recoloured copy of the happy butterfly: wing colours are rotated around the colour wheel (the cream spots stay),
 * or turned into a flat grey silhouette for butterflies the child has not earned yet.
 * Gradient ids are made unique per variant, otherwise web renders every copy with the first copy's colours.
 */
export function tintedButterfly(key: string, degrees: number, mood: Mood = 'happy', locked = false): Art {
  const id = `${key}|${degrees}|${mood}|${locked}`, found = cache.get(id);
  if (found) return found;
  const unique = key.replace(/[^a-z0-9]/gi, '');
  const ids = (xml: string) => xml.replace(/bf-/g, `bf${unique}-`);
  const base = BUTTERFLY_MOODS[mood];
  const wings = ids(base.wings.replace(/#[0-9a-fA-F]{6}\b/g, hex => locked ? grey(hex) : KEEP.has(hex.toLowerCase()) ? hex : rotate(hex, degrees)));
  // Only the purple wing parts that show through in the body layer are recoloured; face and body keep their colours.
  const body = ids(base.body.replace(locked ? /#[0-9a-fA-F]{6}\b/g : /#(9457e8|6538bd)\b/gi, hex => locked ? grey(hex) : rotate(hex, degrees)));
  const art = { wings, body };
  cache.set(id, art);
  return art;
}

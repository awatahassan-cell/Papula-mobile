import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'papoole_audio_v1';
type Row = { key: string; uri: string; usedAt: number };
type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> };
export const audioCacheKey = (text: string, voice: string, model = 'eleven_v4') => JSON.stringify([1, text.normalize('NFC').trim(), voice, model]);
export function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    chunks.push(alphabet[n >>> 18] + alphabet[(n >>> 12) & 63] + (i + 1 < bytes.length ? alphabet[(n >>> 6) & 63] : '=') + (i + 2 < bytes.length ? alphabet[n & 63] : '='));
  }
  return chunks.join('');
}
export function base64ToBytes(value: string): Uint8Array {
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes=new Uint8Array(value.length/4*3-(value.endsWith('==')?2:value.endsWith('=')?1:0));
  let offset=0;
  for(let i=0;i<value.length;i+=4){const n=(alphabet.indexOf(value[i])<<18)|(alphabet.indexOf(value[i+1])<<12)|((alphabet.indexOf(value[i+2])&63)<<6)|(alphabet.indexOf(value[i+3])&63);if(offset<bytes.length)bytes[offset++]=n>>>16;if(offset<bytes.length)bytes[offset++]=(n>>>8)&255;if(offset<bytes.length)bytes[offset++]=n&255;}
  return bytes;
}
const validUri = (uri: unknown): uri is string => {
  if (typeof uri !== 'string' || uri.length > 600000 || !uri.startsWith('data:audio/mpeg;base64,')) return false;
  const payload = uri.slice(23);
  return payload.length > 0 && payload.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(payload);
};

export class AudioCache {
  private rows: Row[] = [];
  private loaded = false;
  private pending: Promise<unknown> = Promise.resolve();
  constructor(private storage: Storage = AsyncStorage, private maxTracks = 64, private maxCharacters = 2000000) {}
  private run<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation, operation);
    this.pending = result.catch(() => undefined);
    return result;
  }
  private async load() {
    if (this.loaded) return;
    try {
      const data: unknown = JSON.parse(await this.storage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(data)) {
        const keys = new Set<string>();
        this.rows = data.filter(row => row && typeof row.key === 'string' && row.key.length < 10000 && validUri(row.uri) && Number.isFinite(row.usedAt) && !keys.has(row.key) && !!keys.add(row.key));
        this.trim();
      }
    } catch { this.rows = []; }
    this.loaded = true;
  }
  private trim() {
    this.rows.sort((a, b) => a.usedAt - b.usedAt);
    let size = this.rows.reduce((sum, row) => sum + row.uri.length, 0);
    while (this.rows.length > this.maxTracks || size > this.maxCharacters) size -= this.rows.shift()!.uri.length;
  }
  get(key: string): Promise<string | null> {
    return this.run(async () => { await this.load(); const row = this.rows.find(item => item.key === key); if (row) row.usedAt = Date.now(); return row?.uri || null; });
  }
  put(key: string, uri: string): Promise<boolean> {
    return this.run(async () => {
      await this.load();
      if (!validUri(uri) || uri.length > this.maxCharacters) return false;
      const previous = this.rows.map(row => ({ ...row }));
      this.rows = this.rows.filter(row => row.key !== key);
      this.rows.push({ key, uri, usedAt: Date.now() }); this.trim();
      try { await this.storage.setItem(STORAGE_KEY, JSON.stringify(this.rows)); return true; }
      catch { this.rows = previous; return false; }
    });
  }
  count(): Promise<number> { return this.run(async () => { await this.load(); return this.rows.length; }); }
}
export const audioCache = new AudioCache();

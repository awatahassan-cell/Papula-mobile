interface Storage { setItem(key: string, value: string): Promise<void>; }
export interface SaveStatus { saving: boolean; failed: boolean; pending: number; }

/** Serializes writes and retains the latest failed value per key for explicit retry. */
export class PersistentWriter {
  private tail: Promise<void> = Promise.resolve();
  private pending = new Map<string, { value: string }>();
  private listeners = new Set<(status: SaveStatus) => void>();
  private saving = false;
  private failedKeys = new Set<string>();
  constructor(private storage: Storage) {}
  status = (): SaveStatus => ({ saving: this.saving, failed: this.failedKeys.size > 0, pending: this.pending.size });
  subscribe = (listener: (status: SaveStatus) => void) => {
    this.listeners.add(listener); listener(this.status());
    return () => { this.listeners.delete(listener); };
  };
  private notify() { for (const listener of this.listeners) listener(this.status()); }
  write(key: string, value: string): Promise<void> {
    const item = { value }; this.pending.set(key, item);
    const run = async () => {
      if (this.pending.get(key) !== item) return;
      this.saving = true; this.notify();
      try {
        await this.storage.setItem(key, value);
        if (this.pending.get(key) === item) this.pending.delete(key);
        this.failedKeys.delete(key);
      } catch { this.failedKeys.add(key); }
      finally { this.saving = false; this.notify(); }
    };
    this.tail = this.tail.then(run, run);
    return this.tail;
  }
  async retry(): Promise<void> {
    const pending = [...this.pending.entries()];
    await Promise.all(pending.map(([key, item]) => this.write(key, item.value)));
  }
}

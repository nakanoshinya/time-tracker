import { writable, get, type Writable } from 'svelte/store';

export type CategoryId =
  | 'c_univ' | 'c_intern' | 'c_toeic' | 'c_learning' | 'c_phone'
  | 'c_fun' | 'c_meal' | 'c_prep' | 'c_move' | 'c_sleep' | 'c_other';

export type LogItem = {
  id: string;
  start: string;           // ISO string
  end: string | null;      // ISO string or null
  category_id: CategoryId;
  note: string;
  task_id?: string | null;
  day_key: string;         // YYYY-MM-DD local key
  duration_sec?: number | null;
  created_at: string;      // ISO string
  updated_at: string;      // ISO string
};

type StartOptions = { note?: string };

function createLogsStore() {
  const logs: Writable<LogItem[]> = writable<LogItem[]>([]);
  const running: Writable<LogItem | null> = writable<LogItem | null>(null);
  let inited = false;

  function updateRunningFromArray(arr: LogItem[]) {
    const open = Array.isArray(arr) ? arr.filter((l) => !l.end) : [];
    if (open.length === 0) {
      running.set(null);
      return;
    }
    open.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
    running.set(open[0]);
  }
  function recomputeRunning() {
    updateRunningFromArray(get(logs));
  }

  async function refresh(): Promise<void> {
    const res = await fetch('/api/logs');
    if (!res.ok) throw new Error('fetch failed');
    const data: LogItem[] = await res.json();
    const list = Array.isArray(data) ? data : [];
    logs.set(list);
    updateRunningFromArray(list);
  }

  async function init(): Promise<void> {
    if (inited) return;
    inited = true;
    await refresh();
  }

  async function manualInsert(v: Partial<LogItem> & { category_id: CategoryId; start: string; end: string | null; note?: string; }): Promise<LogItem> {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(v)
    });
    if (!res.ok) throw new Error('create failed');
    const created: LogItem = await res.json();        // ★ サーバの最終形を採用
    logs.update(arr => [...arr, created]);
    recomputeRunning();
    return created;
  }

  async function manualUpdate(id: string, patch: Partial<LogItem>): Promise<LogItem> {
    const res = await fetch(`/api/logs/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch)
    });
    if (!res.ok) throw new Error('update failed');
    const updated: LogItem = await res.json();        // ★ サーバの最終形を採用
    logs.update(arr => arr.map(l => (l.id === id ? updated : l)));
    recomputeRunning();
    return updated;
  }

  async function start(categoryId: CategoryId, options: StartOptions = {}): Promise<LogItem> {
    const current = get(running);
    if (current) return current; // 既に計測中ならそのまま返す

    const payload = {
      category_id: categoryId,
      start: new Date().toISOString(),
      end: null as const,
      note: options.note ?? ''
    };

    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('start failed');
    const created: LogItem = await res.json();
    logs.update(arr => [...arr, created]);
    running.set(created);
    return created;
  }

  async function stop(): Promise<LogItem | null> {
    const current = get(running);
    if (!current) return null;

    const patch = { end: new Date().toISOString() };
    const res = await fetch(`/api/logs/${current.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch)
    });
    if (!res.ok) throw new Error('stop failed');
    const updated: LogItem = await res.json();
    logs.update(arr => arr.map(l => (l.id === current.id ? updated : l)));
    running.set(null);
    return updated;
  }

  return { logs, running, init, refresh, start, stop, manualInsert, manualUpdate };
}

export const logsStore = createLogsStore();



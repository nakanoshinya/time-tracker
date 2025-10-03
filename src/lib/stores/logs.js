import { writable } from 'svelte/store';

function makeStores() {
  const logs = writable([]);
  const running = writable(null);

  async function init() {
    const res = await fetch('/api/logs');
    const all = await res.json();
    logs.set(all);
    const r = all.find((l) => l.end === null) || null;
    running.set(r);
  }

  async function start(category_id, { task_id = null, note = '' } = {}) {
    // 既存の進行中があれば、先に stop
    let cur;
    running.update((r) => (cur = r, r));
    if (cur && cur.id) await stop();

    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category_id, task_id, note })
    });
    const item = await res.json();
    logs.update((arr) => [...arr, item]);
    running.set(item);
  }

  async function stop() {
    let cur;
    running.update((r) => (cur = r, r));
    if (!cur || !cur.id) return;
    const res = await fetch(`/api/logs/${cur.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ end: new Date().toISOString() })
    });
    const updated = await res.json();
    logs.update((arr) => arr.map((x) => (x.id === updated.id ? updated : x)));
    running.set(null);
  }

  async function manualInsert({ category_id, start, end, note = '', task_id = null }) {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category_id, start, end, note, task_id })
    });
    const item = await res.json();
    logs.update((arr) => {
      const next = [...arr, item];
      next.sort((a,b) => new Date(a.start) - new Date(b.start));
      return next;
    });
  }

  async function manualUpdate(id, patch) {
    const res = await fetch(`/api/logs/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch)
    });
    const updated = await res.json();
    logs.update((arr) => {
      const next = arr.map((x) => (x.id === id ? updated : x));
      next.sort((a,b) => new Date(a.start) - new Date(b.start));
      return next;
    });
  }

  return { logs, running, init, start, stop, manualInsert, manualUpdate };
}

export const logsStore = makeStores();

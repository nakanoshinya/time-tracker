import { browser } from '$app/environment';

const DB_NAME = 'time-tracker';
const DB_VER = 1;
export const STORES = { LOGS: 'logs', CATEGORIES: 'categories', TASKS: 'tasks' };

export function openDB() {
  if (!browser) return Promise.reject(new Error('not in browser'));
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        const cat = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        cat.createIndex('order', 'order', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.LOGS)) {
        const logs = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
        logs.createIndex('start', 'start', { unique: false });
        logs.createIndex('by_day', 'day_key', { unique: false });
        logs.createIndex('category_id', 'category_id', { unique: false });
        logs.createIndex('task_id', 'task_id', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        const tasks = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
        tasks.createIndex('status', 'status', { unique: false });
        tasks.createIndex('due', 'due', { unique: false });
        tasks.createIndex('category_id', 'category_id', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAll(storeName) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, 'readonly');
    const arr = [];
    const req = tx.objectStore(storeName).openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) { arr.push(cur.value); cur.continue(); }
      else { db.close(); res(arr); }
    };
    req.onerror = () => { db.close(); rej(req.error); };
  });
}

export async function put(storeName, item) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, 'readwrite');
    const request = tx.objectStore(storeName).put(item);
    request.onsuccess = () => { tx.oncomplete = () => { db.close(); res(true); }; };
    request.onerror = () => { db.close(); rej(request.error); };
  });
}

export async function bulkPut(storeName, items) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, 'readwrite');
    let count = 0;
    items.forEach(item => {
      const r = tx.objectStore(storeName).put(item);
      r.onsuccess = () => { count += 1; };
      r.onerror = () => { /* ignore individual errors for now */ };
    });
    tx.oncomplete = () => { db.close(); res(count); };
    tx.onerror = () => { db.close(); rej(tx.error); };
  });
}

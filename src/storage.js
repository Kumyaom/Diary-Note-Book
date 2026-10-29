// Persistent key-value storage with the same shape as the window.storage API the app was written for.
// Backed by IndexedDB: large values (photos, long notes) are fine, and it stays on the device.
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("diary-note-book", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
let dbPromise = null;
const db = () => dbPromise || (dbPromise = openDb());

async function run(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction("kv", mode);
    const req = fn(t.objectStore("kv"));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export function installStorage() {
  window.storage = {
    async get(key) {
      const v = await run("readonly", (s) => s.get(key));
      if (v === undefined) throw new Error("Key not found");
      return { key, value: v, shared: false };
    },
    async set(key, value) {
      await run("readwrite", (s) => s.put(String(value), key));
      return { key, value, shared: false };
    },
    async delete(key) {
      await run("readwrite", (s) => s.delete(key));
      return { key, deleted: true, shared: false };
    },
    async list(prefix) {
      const keys = await run("readonly", (s) => s.getAllKeys());
      return { keys: keys.filter((k) => !prefix || String(k).startsWith(prefix)), prefix, shared: false };
    },
  };
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); // ask the OS not to evict it
  } catch (e) {
    /* ignore */
  }
}

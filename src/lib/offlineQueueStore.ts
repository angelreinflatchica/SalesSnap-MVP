export type QueueMethod = "POST" | "PATCH" | "DELETE";

export type OfflineQueueItem = {
  id: string;
  url: string;
  method: QueueMethod;
  headers: Record<string, string>;
  body: string | null;
  createdAt: number;
  retries: number;
  nextAttemptAt: number;
  lastError: string | null;
};

const DB_NAME = "salessnap-offline-db";
const DB_VERSION = 1;
const STORE_NAME = "queue";
const LEGACY_STORAGE_KEY = "salessnap-offline-queue";

function isBrowser() {
  return typeof window !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("nextAttemptAt", "nextAttemptAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txPromise(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function migrateLegacyLocalStorage(db: IDBDatabase) {
  if (!isBrowser()) return;
  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as Array<
      Omit<OfflineQueueItem, "nextAttemptAt" | "lastError"> &
      Partial<Pick<OfflineQueueItem, "nextAttemptAt" | "lastError">>
    >;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const item of parsed) {
      const normalized: OfflineQueueItem = {
        ...item,
        nextAttemptAt: item.nextAttemptAt ?? Date.now(),
        lastError: item.lastError ?? null,
      };
      store.put(normalized);
    }

    await txPromise(tx);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

export async function getAllQueueItems(): Promise<OfflineQueueItem[]> {
  if (!isBrowser()) return [];
  const db = await openDb();
  await migrateLegacyLocalStorage(db);

  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  const rows = await new Promise<OfflineQueueItem[]>((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as OfflineQueueItem[]) ?? []);
    request.onerror = () => reject(request.error);
  });

  await txPromise(tx);
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function putQueueItem(item: OfflineQueueItem): Promise<void> {
  if (!isBrowser()) return;
  const db = await openDb();
  await migrateLegacyLocalStorage(db);

  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(item);
  await txPromise(tx);
}

export async function deleteQueueItem(id: string): Promise<void> {
  if (!isBrowser()) return;
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(id);
  await txPromise(tx);
}

export async function getQueueSize(): Promise<number> {
  const items = await getAllQueueItems();
  return items.length;
}

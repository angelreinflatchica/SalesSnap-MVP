import {
  deleteQueueItem,
  getAllQueueItems,
  getQueueSize,
  putQueueItem,
  type OfflineQueueItem,
  type QueueMethod,
} from "@/lib/offlineQueueStore";

const SUPPORTED_PATHS = ["/api/sales", "/api/expenses"];
const MAX_RETRIES = 6;

function isBrowser() {
  return typeof window !== "undefined";
}

function toHeadersObject(headers?: HeadersInit): Record<string, string> {
  if (!headers) return { "Content-Type": "application/json" };
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return {
    "Content-Type": "application/json",
    ...headers,
  };
}

function isSupportedMutation(url: string, method: string): method is QueueMethod {
  const upper = method.toUpperCase();
  if (upper !== "POST" && upper !== "PATCH" && upper !== "DELETE") {
    return false;
  }

  try {
    const parsed = new URL(url, isBrowser() ? window.location.origin : "http://localhost");
    return SUPPORTED_PATHS.some((path) => parsed.pathname.startsWith(path));
  } catch {
    return false;
  }
}

function createQueueItem(url: string, init: RequestInit): OfflineQueueItem {
  const method = (init.method ?? "POST").toUpperCase() as QueueMethod;
  const headers = toHeadersObject(init.headers);
  const body = typeof init.body === "string" ? init.body : null;

  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    method,
    headers,
    body,
    createdAt: Date.now(),
    retries: 0,
    nextAttemptAt: Date.now(),
    lastError: null,
  };
}

function computeBackoffMs(retries: number): number {
  const cappedRetries = Math.min(retries, MAX_RETRIES);
  return Math.min(5 * 60 * 1000, Math.pow(2, cappedRetries) * 1000);
}

function shouldDropOnStatus(method: QueueMethod, status: number): boolean {
  if ((method === "PATCH" || method === "DELETE") && status === 404) {
    return true;
  }
  if (status === 409 || status === 412) {
    return true;
  }
  return false;
}

export async function getOfflineQueueSize(): Promise<number> {
  return getQueueSize();
}

export async function enqueueOfflineMutation(url: string, init: RequestInit): Promise<void> {
  await putQueueItem(createQueueItem(url, init));
}

export async function flushOfflineQueue(): Promise<{ synced: number; remaining: number; dropped: number }> {
  if (!isBrowser() || !navigator.onLine) {
    return { synced: 0, remaining: await getQueueSize(), dropped: 0 };
  }

  const queue = await getAllQueueItems();
  if (queue.length === 0) {
    return { synced: 0, remaining: 0, dropped: 0 };
  }

  let synced = 0;
  let dropped = 0;
  const now = Date.now();

  for (const item of queue) {
    if (item.nextAttemptAt > now) {
      continue;
    }

    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (res.ok) {
        await deleteQueueItem(item.id);
        synced += 1;
        continue;
      }

      if (shouldDropOnStatus(item.method, res.status)) {
        await deleteQueueItem(item.id);
        dropped += 1;
        continue;
      }

      const retries = item.retries + 1;
      if (retries > MAX_RETRIES) {
        await deleteQueueItem(item.id);
        dropped += 1;
        continue;
      }

      await putQueueItem({
        ...item,
        retries,
        nextAttemptAt: Date.now() + computeBackoffMs(retries),
        lastError: `HTTP ${res.status}`,
      });
    } catch {
      const retries = item.retries + 1;
      if (retries > MAX_RETRIES) {
        await deleteQueueItem(item.id);
        dropped += 1;
        continue;
      }

      await putQueueItem({
        ...item,
        retries,
        nextAttemptAt: Date.now() + computeBackoffMs(retries),
        lastError: "NETWORK_ERROR",
      });
    }
  }

  return { synced, remaining: await getQueueSize(), dropped };
}

export async function sendOrQueue(url: string, init: RequestInit): Promise<{ queued: boolean; response?: Response }> {
  const method = (init.method ?? "GET").toUpperCase();
  const canQueue = isSupportedMutation(url, method);

  if (!canQueue) {
    return { queued: false, response: await fetch(url, init) };
  }

  if (isBrowser() && !navigator.onLine) {
    await enqueueOfflineMutation(url, init);
    return { queued: true };
  }

  try {
    const response = await fetch(url, init);
    return { queued: false, response };
  } catch {
    await enqueueOfflineMutation(url, init);
    return { queued: true };
  }
}

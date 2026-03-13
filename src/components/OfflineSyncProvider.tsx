"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { flushOfflineQueue, getOfflineQueueSize } from "@/lib/offlineSync";

const CONNECTIVITY_CHECK_TIMEOUT_MS = 5000;

async function checkConnectivity() {
  if (typeof window === "undefined") return true;

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CONNECTIVITY_CHECK_TIMEOUT_MS);

    const res = await fetch(`/api/auth/session?ts=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    window.clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    let offlineDebounceTimer: number | null = null;
    let isDisposed = false;

    const refreshConnectivity = async (showOfflineToast: boolean) => {
      const online = await checkConnectivity();
      if (isDisposed) return;

      setIsOnline(online);
      if (!online) {
        getOfflineQueueSize().then((size) => {
          if (!isDisposed) setQueueSize(size);
        });
        if (showOfflineToast) {
          toast.info("You are offline. Changes will sync when internet returns.");
        }
        return;
      }

      const result = await flushOfflineQueue();
      if (isDisposed) return;
      setQueueSize(result.remaining);
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} offline change${result.synced === 1 ? "" : "s"}`);
      }
      if (result.dropped > 0) {
        toast.warning(`${result.dropped} offline change${result.dropped === 1 ? " was" : "s were"} dropped due to conflict or max retries.`);
      }
    };

    refreshConnectivity(false);
    getOfflineQueueSize().then((size) => {
      if (!isDisposed) setQueueSize(size);
    });

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {
          // Service worker registration is best effort.
        });
    }

    const onOnline = async () => {
      await refreshConnectivity(false);
    };

    const onOffline = () => {
      if (offlineDebounceTimer) {
        window.clearTimeout(offlineDebounceTimer);
      }

      // Some browsers fire transient offline events; verify via network call first.
      offlineDebounceTimer = window.setTimeout(() => {
        refreshConnectivity(true);
      }, 1200);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const interval = window.setInterval(async () => {
      await refreshConnectivity(false);
    }, 30000);

    return () => {
      isDisposed = true;
      if (offlineDebounceTimer) {
        window.clearTimeout(offlineDebounceTimer);
      }
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <>
      {!isOnline && (
        <div className="fixed inset-x-0 top-0 z-[100] bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-800">
          Offline mode active. Your changes will sync automatically.
        </div>
      )}
      {isOnline && queueSize > 0 && (
        <div className="fixed inset-x-0 top-0 z-[100] bg-blue-100 px-4 py-2 text-center text-xs font-medium text-blue-800">
          Syncing {queueSize} pending offline change{queueSize === 1 ? "" : "s"}.
        </div>
      )}
      {children}
    </>
  );
}

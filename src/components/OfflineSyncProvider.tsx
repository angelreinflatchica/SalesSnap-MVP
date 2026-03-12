"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { flushOfflineQueue, getOfflineQueueSize } from "@/lib/offlineSync";

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    getOfflineQueueSize().then(setQueueSize);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {
          // Service worker registration is best effort.
        });
    }

    const onOnline = async () => {
      setIsOnline(true);
      const result = await flushOfflineQueue();
      setQueueSize(result.remaining);
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} offline change${result.synced === 1 ? "" : "s"}`);
      }
      if (result.dropped > 0) {
        toast.warning(`${result.dropped} offline change${result.dropped === 1 ? " was" : "s were"} dropped due to conflict or max retries.`);
      }
    };

    const onOffline = () => {
      setIsOnline(false);
      getOfflineQueueSize().then(setQueueSize);
      toast.info("You are offline. Changes will sync when internet returns.");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const interval = window.setInterval(async () => {
      if (!navigator.onLine) return;
      const result = await flushOfflineQueue();
      setQueueSize(result.remaining);
    }, 30000);

    return () => {
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

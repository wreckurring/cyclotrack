import React from "react";
import { Bell, X } from "lucide-react";

export default function NotificationStack({ notifications, onDismiss }) {
  if (!notifications.length) {
    return null;
  }

  return (
    <div className="fixed right-4 top-20 z-30 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="rounded-2xl border border-g-border bg-g-surface px-4 py-3 shadow-g-card"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-g-yellow-tint p-2 text-g-yellow">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-g-ink">{notification.title}</p>
              <p className="mt-1 text-sm text-g-muted">{notification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="rounded-full p-1 text-g-faint transition hover:bg-g-bg hover:text-g-muted"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

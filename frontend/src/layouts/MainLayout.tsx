
import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { api } from "@/services/api";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string | null;
  is_read: boolean;
  created_at: string;
}

export default function MainLayout() {
  const location = useLocation();
  const lastProcessedToken = useRef<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    const publicPaths = [
      "/login",
      "/register",
      "/verify-email",
      "/check-email",
    ];

    if (!token || publicPaths.includes(location.pathname)) {
      setNotifications([]);
      return;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      setLoadingNotifications(true);

      try {
        // Process reminders once per token during this app session.
        if (lastProcessedToken.current !== token) {
          lastProcessedToken.current = token;

          try {
            await api.post("/notifications/process-mood-reminders");
          } catch (error) {
            if (lastProcessedToken.current === token) {
              lastProcessedToken.current = null;
            }
            console.error("Mood reminder processing failed:", error);
          }
        }

        const response = await api.get("/notifications");

        if (!cancelled) {
          setNotifications(response.data);
        }
      } catch (error) {
        console.error("Could not load notifications:", error);
      } finally {
        if (!cancelled) {
          setLoadingNotifications(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (notification.is_read) return;

    try {
      await api.patch(`/notifications/${notification.id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );
    } catch (error) {
      console.error("Could not mark notification as read:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-lg font-semibold">
          AI Mental Wellness Platform
        </h1>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={isOpen}
            className="relative rounded-lg border px-3 py-2 hover:bg-gray-100"
          >
            <span aria-hidden="true">🔔</span>

            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border bg-white shadow-lg">
              <div className="flex items-center justify-between border-b p-3">
                <h2 className="font-semibold">Notifications</h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-900"
                  aria-label="Close notifications"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications && notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">
                    Loading notifications...
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">
                    You're all caught up.
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => void handleNotificationClick(notification)}
                      className={`block w-full border-b p-3 text-left hover:bg-gray-50 ${
                        notification.is_read ? "bg-white" : "bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">
                          {notification.title}
                        </span>
                        {!notification.is_read && (
                          <span
                            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                            aria-label="Unread"
                          />
                        )}
                      </div>

                      {notification.content && (
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.content}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
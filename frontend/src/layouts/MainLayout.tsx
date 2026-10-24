import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, Badge, Button, Spinner } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { classNames } from "@/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string | null;
  is_read: boolean;
  created_at: string;
  appointment_id?: string | null;
}

interface NavLinkItem {
  to: string;
  label: string;
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastProcessedToken = useRef<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setNotifications([]);
      setNotificationsError("");
      return;
    }

    setLoadingNotifications(true);
    setNotificationsError("");

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
      setNotifications(response.data);
    } catch (error) {
      console.error("Could not load notifications:", error);
      setNotificationsError("Could not load notifications. Please try again.");
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [location.pathname, loadNotifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const isAdmin = user?.role === "admin";
  const isProfessional = user?.role === "professional";

  const navLinks: NavLinkItem[] = isAdmin
    ? [
        { to: "/admin", label: "Overview" },
        { to: "/admin/applications", label: "Applications" },
        { to: "/admin/appointments", label: "Appointments" },
        { to: "/admin/users", label: "Users" },
        { to: "/admin/analytics", label: "Analytics" },
        { to: "/admin/reports", label: "Reports" },
        { to: "/admin/knowledge-base", label: "Knowledge Base" },
        { to: "/admin/content", label: "Content" },
        { to: "/settings", label: "Settings" },
      ]
    : isProfessional
      ? [
          { to: "/professional/dashboard", label: "Dashboard" },
          { to: "/appointments", label: "My Appointments" },
          { to: "/settings", label: "Settings" },
        ]
      : [
          { to: "/dashboard", label: "Dashboard" },
          { to: "/chat", label: "AI Companion" },
          { to: "/assessment", label: "Assessment" },
          { to: "/mood", label: "Mood Tracking" },
          { to: "/professionals", label: "Professionals" },
          { to: "/appointments", label: "My Appointments" },
          { to: "/professional-application", label: "Become a Professional" },
          { to: "/settings", label: "Settings" },
        ];

  const homeHref = isAdmin
    ? "/admin"
    : isProfessional
      ? "/professional/dashboard"
      : "/dashboard";

  // Longest matching link wins so "/admin" isn't highlighted on
  // "/admin/applications", etc.
  const activeTo = navLinks
    .filter(
      (link) =>
        location.pathname === link.to ||
        location.pathname.startsWith(`${link.to}/`)
    )
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;

  // Close transient UI whenever the route changes.
  useEffect(() => {
    setMobileMenuOpen(false);
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Close the mobile drawer with Escape only while it is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const navigateToNotificationTarget = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      try {
        await api.patch(`/notifications/${notification.id}/read`);

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        );
      } catch (error) {
        console.error("Could not mark notification as read:", error);
      }
    }

    setIsOpen(false);

    // Reminder/appointment notifications are linked server-side; navigate to
    // the relevant appointment detail so the user can act on it.
    if ((notification as any).appointment_id) {
      navigate(`/appointments/${(notification as any).appointment_id}`);
      return;
    }

    // Non-appointment notifications (mood prompts, system messages) stay in
    // context or go to a sensible default.
    if (notification.type === "mood_reminder") {
      navigate("/mood");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || user?.email || "Account";

  const navItems = (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {navLinks.map((link) => {
        const active = link.to === activeTo;

        return (
          <Link
            key={link.to}
            to={link.to}
            aria-current={active ? "page" : undefined}
            className={classNames(
              "rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-100 text-brand-700"
                : "text-ink-600 hover:bg-mist hover:text-ink-900"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const userCard = (
    <div className="flex items-center gap-3 rounded-3xl border border-line bg-mist p-3">
      <Avatar name={displayName} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">
          {displayName}
        </p>
        <p className="truncate text-xs capitalize text-ink-400">
          {user?.role ?? "member"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-900 focus:shadow-lift"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <Link
          to={homeHref}
          className="mb-8 inline-flex items-center gap-2 px-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500 text-sm font-bold text-white shadow-soft">
            M
          </span>
          <span className="text-lg font-bold tracking-tight text-ink-900">
            Mindora
          </span>
        </Link>

        <div className="flex-1 overflow-y-auto">{navItems}</div>

        <div className="mt-6 space-y-3">
          {userCard}

          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={handleLogout}
            className="justify-start"
          >
            Log out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="safe-top sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            className="rounded-xl border border-line p-2 text-ink-600 transition-colors hover:bg-mist lg:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <Link
            to={homeHref}
            className="inline-flex items-center gap-2 lg:hidden"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
              M
            </span>
            <span className="text-base font-bold tracking-tight text-ink-900">
              Mindora
            </span>
          </Link>

          <div className="flex-1" />

          <ThemeToggle />

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              className="relative rounded-xl border border-line p-2 text-ink-600 transition-colors hover:bg-mist"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 3a4.5 4.5 0 0 0-4.5 4.5c0 3-1 4-1 4h11s-1-1-1-4A4.5 4.5 0 0 0 10 3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.5 15a1.8 1.8 0 0 0 3 0"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-line bg-surface shadow-lift"
              >
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <h2 className="text-sm font-semibold text-ink-900">
                    Notifications
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1 text-ink-400 transition-colors hover:bg-mist hover:text-ink-700"
                    aria-label="Close notifications"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 5l10 10M15 5L5 15"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notificationsError ? (
                    <div className="space-y-3 p-4">
                      <p className="text-sm text-red-600">
                        {notificationsError}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void loadNotifications()}
                        loading={loadingNotifications}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : loadingNotifications && notifications.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-ink-500">
                      <Spinner size="sm" className="text-brand-500" />
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="p-4 text-sm text-ink-500">
                      You're all caught up.
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        onClick={() =>
                          void navigateToNotificationTarget(notification)
                        }
                        className={classNames(
                          "block w-full border-b border-line p-4 text-left transition-colors hover:bg-mist",
                          notification.is_read ? "bg-surface" : "bg-brand-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-ink-900">
                            {notification.title}
                          </span>
                          {!notification.is_read && (
                            <span
                              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500"
                              aria-label="Unread"
                            />
                          )}
                        </div>

                        {notification.content && (
                          <p className="mt-1 text-sm text-ink-500">
                            {notification.content}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-ink-300">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {user && (
            <Badge tone="brand" className="hidden capitalize sm:inline-flex">
              {user.role}
            </Badge>
          )}
        </header>

        {/* Mobile navigation drawer (slides in from the left) */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <nav
              id="mobile-nav"
              aria-label="Primary"
              role="dialog"
              aria-modal="true"
              className="fixed inset-y-0 left-0 z-50 w-[min(85vw,320px)] space-y-1.5 overflow-y-auto border-r border-line bg-surface px-4 py-6 shadow-lift lg:hidden"
            >
              <div className="mb-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="rounded-xl border border-line p-2 text-ink-600 transition-colors hover:bg-mist"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {navItems}

              <div className="pt-3">{userCard}</div>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={handleLogout}
                className="mt-2 justify-start"
              >
                Log out
              </Button>
            </nav>
          </>
        )}

        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

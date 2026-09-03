"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsAuthenticated } from "@/lib/store/hooks";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  formatNotificationTime,
  type AppNotification,
} from "@/lib/api/notifications";

// The backend has no websocket transport, so the bell polls. A minute is often
// enough for "a task was just posted" without putting every signed-in student
// on a tight loop against the API.
const POLL_INTERVAL_MS = 60_000;
const NOTIFICATION_LIMIT = 20;

export function NotificationBell() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Guards against a poll landing after the component is gone, and against two
  // fetches overlapping when a focus event coincides with the interval.
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const data = await getNotifications({ limit: NOTIFICATION_LIMIT });
      if (!isMountedRef.current) return;
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (error) {
      // A background poll failing is not worth a toast — it would fire once a
      // minute for as long as the API is down.
      console.error("Failed to load notifications:", error);
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    fetchNotifications();

    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    // Catches up immediately when someone returns to the tab, rather than
    // leaving them looking at a stale count for up to a minute.
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, fetchNotifications]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) fetchNotifications();
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    setIsOpen(false);

    if (!notification.read) {
      // Optimistic: the badge should drop the moment it is clicked.
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, read: true } : item,
        ),
      );
      setUnreadCount((count) => Math.max(count - 1, 0));

      try {
        const { unreadCount: serverCount } = await markNotificationAsRead(
          notification._id,
        );
        if (isMountedRef.current) setUnreadCount(serverCount);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        fetchNotifications();
      }
    }

    if (notification.link) router.push(notification.link);
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      if (!isMountedRef.current) return;
      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      if (isMountedRef.current) setIsMarkingAll(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <span
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full
                         bg-[#ec1c24] px-1 text-[10px] font-semibold leading-none text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="text-xs font-medium text-[#219ebc] hover:underline disabled:opacity-60"
            >
              {isMarkingAll ? "Marking..." : "Mark all read"}
            </button>
          )}
        </div>

        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-[#ffb703]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Check className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li key={notification._id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        notification.read ? "bg-transparent" : "bg-[#ffb703]"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm ${
                          notification.read
                            ? "font-medium text-muted-foreground"
                            : "font-semibold text-foreground"
                        }`}
                      >
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/70">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

import axiosInstance from "./axios";

/**
 * In-app notifications.
 *
 * The backend has no websocket transport (socket.io is a dependency but is
 * never started), so the bell polls. Endpoints live under the backend's own
 * `/api` router, hence the literal `/api` segment in every path here.
 */

export type NotificationType =
  | "assignment_posted"
  | "exception_requested"
  | "exception_reviewed"
  | "exception_blocked";

export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** A client route to open when the notification is clicked. */
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

/** The signed-in user's notifications, newest first, plus their unread count. */
export async function getNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsResponse> {
  const response = await axiosInstance.get(`/api/notifications`, {
    params: {
      limit: params?.limit,
      unreadOnly: params?.unreadOnly ? "true" : undefined,
    },
  });
  return response.data;
}

/** Mark one notification read. Returns the recalculated unread count. */
export async function markNotificationAsRead(
  id: string,
): Promise<{ message: string; unreadCount: number }> {
  const response = await axiosInstance.patch(`/api/notifications/${id}/read`);
  return response.data;
}

/** Mark every unread notification read. */
export async function markAllNotificationsAsRead(): Promise<{
  message: string;
  modifiedCount: number;
  unreadCount: number;
}> {
  const response = await axiosInstance.patch(`/api/notifications/read-all`);
  return response.data;
}

/** "just now", "5m ago", "3h ago", "2d ago", then a date. */
export function formatNotificationTime(value: string): string {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(then).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

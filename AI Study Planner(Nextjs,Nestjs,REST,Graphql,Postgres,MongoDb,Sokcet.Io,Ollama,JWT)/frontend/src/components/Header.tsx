"use client";
import { Bell, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getPlans, type ApiPlan } from "@/lib/study-planner-api";
import { useAuth } from "@/lib/auth-context";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string;
};

function buildNotifications(plans: ApiPlan[]): NotificationItem[] {
  const notifications: NotificationItem[] = [];

  for (const plan of plans) {
    const tasks = plan.topics.flatMap((topic) =>
      topic.tasks.map((task) => ({
        ...task,
        topicName: topic.name,
      })),
    );

    const inProgressTask = tasks.find((task) => task.status === "in_progress");
    if (inProgressTask) {
      notifications.push({
        id: `in-progress-${inProgressTask.id}`,
        title: `${plan.title} is active`,
        message: `${inProgressTask.title} in ${inProgressTask.topicName} is currently in progress.`,
        href: `/plans/${plan.id}`,
      });
    }

    const pendingTasks = tasks.filter((task) => task.status === "pending").slice(0, 2);
    for (const task of pendingTasks) {
      notifications.push({
        id: `pending-${task.id}`,
        title: `Pending task in ${plan.title}`,
        message: task.deadline
          ? `${task.title} in ${task.topicName} is still pending. Deadline: ${task.deadline}.`
          : `${task.title} in ${task.topicName} is still pending.`,
        href: `/plans/${plan.id}`,
      });
    }

    if (plan.progress === 100) {
      notifications.push({
        id: `complete-${plan.id}`,
        title: `${plan.title} completed`,
        message: "This plan is complete. Review it or start a new plan.",
        href: `/plans/${plan.id}`,
      });
    }
  }

  return notifications.slice(0, 6);
}

function getDismissedNotificationsKey(userId: string) {
  return `study-planner-dismissed-notifications:${userId}`;
}

type HeaderProps = {
  onMenuToggle: () => void;
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setDismissedIds([]);
      return;
    }

    const saved = window.localStorage.getItem(getDismissedNotificationsKey(user.id));
    if (!saved) {
      setDismissedIds([]);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as string[];
      setDismissedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setDismissedIds([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    const userId = user.id;

    async function loadNotifications() {
      try {
        const plans = await getPlans(userId);
        const nextNotifications = buildNotifications(plans).filter(
          (notification) => !dismissedIds.includes(notification.id),
        );
        setNotifications(nextNotifications);
      } catch {
        setNotifications([]);
      }
    }

    void loadNotifications();
  }, [dismissedIds, pathname, user?.id]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const unreadCount = useMemo(() => notifications.length, [notifications]);

  function handleDismissNotification(notificationId: string) {
    if (!user?.id) {
      return;
    }

    const nextDismissedIds = [...dismissedIds, notificationId];
    setDismissedIds(nextDismissedIds);
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
    window.localStorage.setItem(
      getDismissedNotificationsKey(user.id),
      JSON.stringify(nextDismissedIds),
    );
  }

  return (
    <header className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:max-w-md sm:flex-none sm:w-full">
            <Search size={16} className="shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
        <div className="relative" ref={panelRef}>
          <button
            className="relative p-2 rounded-full hover:bg-gray-100 transition"
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-label="Open notifications"
          >
            <Bell size={20} className="text-gray-500" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-semibold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
              <div className="absolute left-0 top-full z-20 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:left-auto sm:right-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Notifications</p>
                  <p className="text-xs text-gray-400">Updates from your study plans</p>
                </div>
                <span className="text-xs font-semibold text-primary">{unreadCount}</span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500">You&apos;re all caught up.</div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition"
                    >
                      <Link
                        href={notification.href}
                        className="min-w-0 flex-1"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        <p className="text-sm font-semibold text-gray-800">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notification.message}</p>
                      </Link>
                      <button
                        type="button"
                        aria-label="Dismiss notification"
                        onClick={() => handleDismissNotification(notification.id)}
                        className="mt-0.5 rounded-lg p-1 text-gray-300 hover:bg-white hover:text-gray-500 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {initials || "U"}
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-gray-800">{user?.name ?? "User"}</span>
            <span className="block truncate text-xs font-medium text-primary">{user?.plan ?? "free"}</span>
          </div>
        </div>
        <button
          className="shrink-0 text-xs font-semibold text-gray-500 hover:text-gray-700"
          onClick={logout}
        >
          Logout
        </button>
      </div>
      </div>
    </header>
  );
}

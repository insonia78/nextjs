"use client";
import { Bell, Search, X } from "lucide-react";
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

export default function Header() {
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

    async function loadNotifications() {
      try {
        const plans = await getPlans(user.id);
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
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-72">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search anything..."
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
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
            <div className="absolute right-0 top-full mt-2 w-96 rounded-2xl border border-gray-200 bg-white shadow-xl z-20 overflow-hidden">
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
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
            {initials || "U"}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-800">{user?.name ?? "User"}</span>
            <span className="text-xs text-primary font-medium">{user?.plan ?? "free"}</span>
          </div>
        </div>
        <button
          className="text-xs font-semibold text-gray-500 hover:text-gray-700"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { useNotificationStore } from '@/store/notification.store';
import { chatClient } from '@/lib/apollo';
import { GET_CHANNELS, CREATE_CHANNEL } from '@/lib/graphql';
import { getChatSocket, getNotifySocket } from '@/lib/socket';
import { notifyApi } from '@/lib/api';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const { channels, setChannels, activeChannelId, setActiveChannel, setUserOnline, setUserOffline } = useChatStore();
  const { notifications, unreadCount, addNotification, setNotifications } = useNotificationStore();
  const [newChannel, setNewChannel] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const teamId = user?.teamId || 'default-team';

  useEffect(() => {
    if (!user) return;

    // Load channels
    chatClient.query({ query: GET_CHANNELS, variables: { teamId } }).then((res) => {
      setChannels(res.data.channelsByTeam || []);
    }).catch(() => {});

    // Load notifications
    notifyApi.getForUser(user.id).then(setNotifications).catch(() => {});

    // Connect sockets
    const chatSock = getChatSocket(user.id);
    chatSock.on('presence:online', ({ userId }: { userId: string }) => setUserOnline(userId));
    chatSock.on('presence:offline', ({ userId }: { userId: string }) => setUserOffline(userId));

    const notifySock = getNotifySocket(user.id);
    notifySock.on('notification', addNotification);

    return () => {
      chatSock.off('presence:online');
      chatSock.off('presence:offline');
      notifySock.off('notification');
    };
  }, [user]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.trim()) return;
    try {
      const res = await chatClient.mutate({
        mutation: CREATE_CHANNEL,
        variables: { name: newChannel.trim(), teamId },
      });
      setChannels([...channels, res.data.createChannel]);
      setNewChannel('');
      setShowNewChannel(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/auth');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.teamName}>⚡ CollabSpace</div>
        <div className={styles.headerActions}>
          <button
            className={styles.notifBtn}
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className={styles.notifPanel}>
          <div className={styles.notifHeader}>
            <span>Notifications</span>
            <button onClick={() => setShowNotifications(false)}>✕</button>
          </div>
          <div className={styles.notifList}>
            {notifications.length === 0 ? (
              <p className={styles.empty}>No notifications</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n.id} className={`${styles.notifItem} ${n.read ? styles.read : ''}`}>
                  <span>{n.message}</span>
                  <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={styles.nav}>
        <Link href="/workspace/chat" className={`${styles.navItem} ${pathname.startsWith('/workspace/chat') ? styles.active : ''}`}>
          💬 <span>Chat</span>
        </Link>
        <Link href="/workspace/tasks" className={`${styles.navItem} ${pathname.startsWith('/workspace/tasks') ? styles.active : ''}`}>
          ✅ <span>Tasks</span>
        </Link>
        <Link href="/workspace/docs" className={`${styles.navItem} ${pathname.startsWith('/workspace/docs') ? styles.active : ''}`}>
          📄 <span>Docs</span>
        </Link>
      </nav>

      <div className={styles.divider} />

      {/* Channels */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>CHANNELS</span>
          <button onClick={() => setShowNewChannel(!showNewChannel)} className={styles.addBtn} title="Add channel">+</button>
        </div>

        {showNewChannel && (
          <form onSubmit={handleCreateChannel} className={styles.newChannelForm}>
            <input
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="channel-name"
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }}>Add</button>
          </form>
        )}

        <div className={styles.channelList}>
          {channels.map((ch) => (
            <button
              key={ch.id}
              className={`${styles.channelItem} ${activeChannelId === ch.id ? styles.activeChannel : ''}`}
              onClick={() => {
                setActiveChannel(ch.id);
                router.push('/workspace/chat');
              }}
            >
              # <span className={styles.channelName}>{ch.name}</span>
            </button>
          ))}
          {channels.length === 0 && (
            <p className={styles.empty}>No channels yet</p>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className={styles.userSection}>
        <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
        <div className={styles.userInfo}>
          <span className={styles.username}>{user?.username}</span>
          <span className={styles.userRole}>{user?.role}</span>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">↪</button>
      </div>
    </aside>
  );
}

'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { GET_MESSAGES } from '@/lib/graphql';
import { getChatSocket } from '@/lib/socket';
import { chatClient } from '@/lib/apollo';
import { SEND_MESSAGE } from '@/lib/graphql';
import { Message } from '@/store/chat.store';
import styles from './ChatView.module.css';
import { formatDistanceToNow } from 'date-fns';

export default function ChatView() {
  const { user } = useAuthStore();
  const {
    channels,
    activeChannelId,
    messages,
    addMessage,
    setMessages,
    typingUsers,
    setTyping,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const channelMessages = (activeChannelId ? messages[activeChannelId] : []) || [];
  const currentTyping = (activeChannelId ? typingUsers[activeChannelId] : []) || [];

  // Load messages for active channel
  const { loading } = useQuery(GET_MESSAGES, {
    variables: { channelId: activeChannelId, take: 50 },
    skip: !activeChannelId,
    client: chatClient,
    onCompleted: (data) => {
      if (activeChannelId) {
        const sorted = [...(data.messages || [])].reverse();
        setMessages(activeChannelId, sorted);
      }
    },
  });

  // Socket listeners
  useEffect(() => {
    if (!user || !activeChannelId) return;
    const socket = getChatSocket(user.id);

    socket.emit('join:channel', { channelId: activeChannelId });

    socket.on('message:new', (msg: Message) => {
      addMessage(msg);
    });

    socket.on('typing:start', ({ userId, username }: { userId: string; username: string }) => {
      setTyping(activeChannelId, [
        ...(typingUsers[activeChannelId] || []).filter((t) => t.userId !== userId),
        { userId, username },
      ]);
    });

    socket.on('typing:stop', ({ userId }: { userId: string }) => {
      setTyping(
        activeChannelId,
        (typingUsers[activeChannelId] || []).filter((t) => t.userId !== userId),
      );
    });

    return () => {
      socket.emit('leave:channel', { channelId: activeChannelId });
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [user, activeChannelId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  const sendTyping = useCallback(
    (active: boolean) => {
      if (!user || !activeChannelId) return;
      const socket = getChatSocket(user.id);
      if (active) {
        socket.emit('typing:start', { channelId: activeChannelId, userId: user.id, username: user.username });
      } else {
        socket.emit('typing:stop', { channelId: activeChannelId, userId: user.id });
      }
    },
    [user, activeChannelId],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(true);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(false);
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChannelId || !user) return;

    setSending(true);
    sendTyping(false);
    setIsTyping(false);
    clearTimeout(typingTimerRef.current);

    const content = input.trim();
    setInput('');

    try {
      // Optimistic add
      const optimistic: Message = {
        id: `temp-${Date.now()}`,
        content,
        senderId: user.id,
        channelId: activeChannelId,
        createdAt: new Date().toISOString(),
      };
      addMessage(optimistic);

      // Send via socket (also triggers server-side persistence)
      const socket = getChatSocket(user.id);
      socket.emit('message:send', { content, senderId: user.id, channelId: activeChannelId });
    } finally {
      setSending(false);
    }
  };

  if (!activeChannelId || channels.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>💬</span>
          <h2>Welcome to Chat</h2>
          <p>Select a channel from the sidebar or create a new one to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.channelInfo}>
          <span className={styles.channelHash}>#</span>
          <span className={styles.channelName}>{activeChannel?.name || 'channel'}</span>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {loading && <div className={styles.loading}>Loading messages...</div>}
        {channelMessages.map((msg, i) => {
          const isMe = msg.senderId === user?.id;
          const prevMsg = channelMessages[i - 1];
          const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;
          return (
            <div key={msg.id} className={`${styles.message} ${isMe ? styles.mine : ''}`}>
              {showSender && (
                <div className={styles.sender}>
                  <div className="avatar">{msg.senderId[0]?.toUpperCase()}</div>
                  <span className={styles.senderName}>{isMe ? 'You' : msg.senderId.slice(0, 8)}</span>
                  <span className={styles.time}>
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                </div>
              )}
              <div className={styles.bubble}>{msg.content}</div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {currentTyping.length > 0 && (
          <div className={styles.typing}>
            <div className={styles.typingDots}>
              <span /><span /><span />
            </div>
            <span>
              {currentTyping.map((t) => t.username).join(', ')} {currentTyping.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className={styles.inputArea}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder={`Message #${activeChannel?.name || 'channel'}`}
          disabled={sending}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className={`btn btn-primary ${styles.sendBtn}`}
        >
          Send
        </button>
      </form>
    </div>
  );
}

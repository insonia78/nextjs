import { create } from 'zustand';

export interface Channel {
  id: string;
  name: string;
  teamId: string;
  type: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  channelId: string;
  createdAt: string;
  editedAt?: string;
}

interface Typing {
  userId: string;
  username: string;
}

interface ChatStore {
  channels: Channel[];
  activeChannelId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, Typing[]>;
  onlineUsers: Set<string>;
  setChannels: (channels: Channel[]) => void;
  setActiveChannel: (id: string) => void;
  addMessage: (message: Message) => void;
  setMessages: (channelId: string, messages: Message[]) => void;
  setTyping: (channelId: string, users: Typing[]) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  channels: [],
  activeChannelId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),

  setChannels: (channels) => set({ channels }),
  setActiveChannel: (id) => set({ activeChannelId: id }),
  addMessage: (message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [message.channelId]: [
          ...(state.messages[message.channelId] || []),
          message,
        ],
      },
    })),
  setMessages: (channelId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [channelId]: messages },
    })),
  setTyping: (channelId, users) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [channelId]: users },
    })),
  setUserOnline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.add(userId);
      return { onlineUsers: next };
    }),
  setUserOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),
}));

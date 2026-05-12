import { io, Socket } from 'socket.io-client';

const CHAT_WS = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'ws://localhost:4002';
const NOTIFY_WS = process.env.NEXT_PUBLIC_NOTIFY_WS_URL || 'ws://localhost:4004';

let chatSocket: Socket | null = null;
let notifySocket: Socket | null = null;

export function getChatSocket(userId: string): Socket {
  if (!chatSocket || !chatSocket.connected) {
    chatSocket = io(`${CHAT_WS}/chat`, {
      auth: { userId },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return chatSocket;
}

export function getNotifySocket(userId: string): Socket {
  if (!notifySocket || !notifySocket.connected) {
    notifySocket = io(`${NOTIFY_WS}/notifications`, {
      auth: { userId },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return notifySocket;
}

export function disconnectAll() {
  chatSocket?.disconnect();
  notifySocket?.disconnect();
  chatSocket = null;
  notifySocket = null;
}

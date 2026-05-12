"use client";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000";

export interface ProgressSession {
  _id?: string;
  userId: string;
  planId?: string;
  topicId?: string;
  taskId?: string;
  timeSpent: number;
  completed?: boolean;
  createdAt?: string;
}

interface UseProgressSocketOptions {
  onProgressUpdated: (session: ProgressSession) => void;
}

export function useProgressSocket({ onProgressUpdated }: UseProgressSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.debug("[WS] Connected to progress gateway:", socket.id);
    });

    socket.on("progressUpdated", (session: ProgressSession) => {
      onProgressUpdated(session);
    });

    socket.on("disconnect", (reason) => {
      console.debug("[WS] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[WS] Connection error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  // onProgressUpdated intentionally excluded — callers should memoize the callback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socketRef;
}

import { create } from "zustand";
import { getSocket, destroySocket } from "@/lib/socket";
import { useChatStore } from "./chatStore";
import type { Message } from "./chatStore";
import type { User } from "./authStore";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

interface SocketState {
  status: ConnectionStatus;
  transport: string;

  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, content: string, tempId: string) => void;
  emitTyping: (roomId: string) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  status: "disconnected",
  transport: "N/A",

  connect: () => {
    const socket = getSocket();

    if (socket.connected) {
      set({ status: "connected", transport: socket.io.engine?.transport?.name || "websocket" });
      return;
    }

    set({ status: "connecting" });

    socket.on("connect", () => {
      set({
        status: "connected",
        transport: socket.io.engine?.transport?.name || "websocket",
      });

      // Re-join the active room on reconnect
      const activeRoomId = useChatStore.getState().activeRoomId;
      if (activeRoomId) {
        socket.emit("join_room", { roomId: activeRoomId });
      }
    });

    socket.on("disconnect", () => {
      set({ status: "disconnected", transport: "N/A" });
    });

    socket.io.on("reconnect_attempt", () => {
      set({ status: "reconnecting" });
    });

    socket.io.on("reconnect_failed", () => {
      set({ status: "disconnected" });
    });

    // ─── Server events ─────────────────────────────────────────
    socket.on("new_message", (message: Message) => {
      useChatStore.getState().addMessage(message);
    });

    socket.on(
      "message_ack",
      ({ tempId, message }: { tempId: string; message: Message }) => {
        useChatStore.getState().confirmMessage(tempId, message);
      },
    );

    socket.on("typing", ({ roomId, userId, username }: { roomId: string; userId: string; username: string }) => {
      useChatStore.getState().setTypingUser(roomId, { id: userId, username });
    });

    socket.on("error", (data: { message: string }) => {
      console.error("[Socket] Server error:", data.message);
    });

    socket.connect();
  },

  disconnect: () => {
    destroySocket();
    set({ status: "disconnected", transport: "N/A" });
  },

  joinRoom: (roomId) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("join_room", { roomId });
    }
  },

  leaveRoom: (roomId) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("leave_room", { roomId });
    }
  },

  sendMessage: (roomId, content, tempId) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("send_message", { roomId, content, tempId });
    }
  },

  emitTyping: (roomId) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("typing", { roomId });
    }
  },
}));

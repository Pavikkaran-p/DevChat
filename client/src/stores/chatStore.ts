import { create } from "zustand";
import { api } from "@/lib/api";
import type { User } from "./authStore";

// ─── Types ──────────────────────────────────────────────────────────

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  roomId: string;
  user: Pick<User, "id" | "username">;
  /** Client-side only fields for optimistic updates */
  tempId?: string;
  status?: "pending" | "confirmed" | "failed";
}

export interface Room {
  id: string;
  name: string;
  type: "DIRECT" | "GROUP";
  createdAt: string;
  _count?: { members: number };
}

interface PaginationCursor {
  nextCursor: { createdAt: string; id: string } | null;
  hasMore: boolean;
}

interface ChatState {
  messagesByRoom: Record<string, Message[]>;
  rooms: Room[];
  activeRoomId: string | null;
  isLoadingMessages: boolean;
  isLoadingRooms: boolean;
  cursors: Record<string, PaginationCursor>;
  typingUsers: Record<string, User[]>;

  // Room actions
  setActiveRoom: (roomId: string) => void;
  fetchRooms: () => Promise<void>;
  createRoom: (name: string, type: string) => Promise<Room>;

  // Message actions
  fetchMessages: (roomId: string, cursor?: string) => Promise<void>;
  addMessage: (message: Message) => void;
  addOptimisticMessage: (
    roomId: string,
    content: string,
    tempId: string,
    user: User,
  ) => void;
  confirmMessage: (tempId: string, confirmedMessage: Message) => void;
  rollbackMessage: (tempId: string, roomId: string) => void;

  // Typing
  setTypingUser: (roomId: string, user: User) => void;
  clearTypingUser: (roomId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByRoom: {},
  rooms: [],
  activeRoomId: null,
  isLoadingMessages: false,
  isLoadingRooms: false,
  cursors: {},
  typingUsers: {},

  setActiveRoom: (roomId) => {
    set({ activeRoomId: roomId });
  },

  fetchRooms: async () => {
    set({ isLoadingRooms: true });
    try {
      const data = await api.get<{ status: string; data: { rooms: Room[] } }>("/api/rooms");
      set({ rooms: data.data.rooms, isLoadingRooms: false });
    } catch {
      set({ isLoadingRooms: false });
    }
  },

  createRoom: async (name, type) => {
    const data = await api.post<{ status: string; data: { room: Room } }>("/api/rooms", { name, type });
    set((state) => ({ rooms: [data.data.room, ...state.rooms] }));
    return data.data.room;
  },

  fetchMessages: async (roomId, cursor) => {
    const state = get();

    // Prevent duplicate fetches
    if (state.isLoadingMessages) return;

    // Check if we've already loaded all messages for this room
    const cursorState = state.cursors[roomId];
    if (cursorState && !cursorState.hasMore && cursor) return;

    set({ isLoadingMessages: true });

    try {
      const params = new URLSearchParams({ limit: "50" });
      if (cursor) {
        params.set("cursor_created_at", cursor);
        // cursor is the createdAt + id composite, stored as "createdAt|id"
        const parts = cursor.split("|");
        if (parts.length === 2) {
          params.set("cursor_created_at", parts[0]);
          params.set("cursor_id", parts[1]);
        }
      }

      const data = await api.get<{
        status: string;
        data: {
          messages: Message[];
          hasMore: boolean;
          nextCursor: { createdAt: string; id: string } | null;
        };
      }>(`/api/rooms/${roomId}/messages?${params}`);

      const result = data.data;

      set((state) => {
        const existing = state.messagesByRoom[roomId] || [];
        // Server returns newest-first; reverse for chronological display
        const fetched = [...result.messages].reverse();
        // Prepend older messages (cursor-based pagination loads older first)
        const merged = cursor
          ? [...fetched, ...existing]
          : fetched;

        return {
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: merged,
          },
          cursors: {
            ...state.cursors,
            [roomId]: {
              nextCursor: result.nextCursor,
              hasMore: result.hasMore,
            },
          },
          isLoadingMessages: false,
        };
      });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  addMessage: (message) => {
    set((state) => {
      const roomMessages = state.messagesByRoom[message.roomId] || [];

      // Deduplicate: don't add if we already have this message
      if (roomMessages.some((m) => m.id === message.id)) {
        return state;
      }

      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [message.roomId]: [...roomMessages, message],
        },
      };
    });
  },

  addOptimisticMessage: (roomId, content, tempId, user) => {
    const optimistic: Message = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      roomId,
      user: { id: user.id, username: user.username },
      tempId,
      status: "pending",
    };

    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: [...(state.messagesByRoom[roomId] || []), optimistic],
      },
    }));
  },

  confirmMessage: (tempId, confirmedMessage) => {
    set((state) => {
      const updated: Record<string, Message[]> = {};

      for (const [roomId, messages] of Object.entries(state.messagesByRoom)) {
        updated[roomId] = messages.map((m) =>
          m.tempId === tempId
            ? { ...confirmedMessage, status: "confirmed" as const }
            : m,
        );
      }

      return { messagesByRoom: updated };
    });
  },

  rollbackMessage: (tempId, roomId) => {
    set((state) => {
      const messages = state.messagesByRoom[roomId] || [];
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomId]: messages.map((m) =>
            m.tempId === tempId ? { ...m, status: "failed" as const } : m,
          ),
        },
      };
    });
  },

  setTypingUser: (roomId, user) => {
    set((state) => {
      const current = state.typingUsers[roomId] || [];
      if (current.some((u) => u.id === user.id)) return state;

      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: [...current, user],
        },
      };
    });

    // Auto-clear after 3 seconds
    setTimeout(() => {
      get().clearTypingUser(roomId, user.id);
    }, 3000);
  },

  clearTypingUser: (roomId, userId) => {
    set((state) => {
      const current = state.typingUsers[roomId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: current.filter((u) => u.id !== userId),
        },
      };
    });
  },
}));

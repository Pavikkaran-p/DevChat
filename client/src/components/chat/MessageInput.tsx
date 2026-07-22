"use client";

import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { useSocketStore } from "@/stores/socketStore";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";

interface MessageInputProps {
  roomId: string;
}

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

export function MessageInput({ roomId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { status, sendMessage, emitTyping } = useSocketStore();
  const addOptimisticMessage = useChatStore((s) => s.addOptimisticMessage);
  const rollbackMessage = useChatStore((s) => s.rollbackMessage);
  const user = useAuthStore((s) => s.user);

  const isDisabled = status !== "connected";

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || isDisabled || !user) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Optimistic update — add message immediately
    addOptimisticMessage(roomId, trimmed, tempId, user);

    // Emit to server
    sendMessage(roomId, trimmed, tempId);

    // Set a timeout for failed delivery
    setTimeout(() => {
      const messages = useChatStore.getState().messagesByRoom[roomId] || [];
      const msg = messages.find((m) => m.tempId === tempId);
      if (msg && msg.status === "pending") {
        rollbackMessage(tempId, roomId);
      }
    }, 10000); // 10s timeout

    setContent("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, isDisabled, user, roomId, addOptimisticMessage, sendMessage, rollbackMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;

    // Debounced typing indicator
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      emitTyping(roomId);
    }, 300);
  };

  return (
    <div className="border-t border-white/5 px-4 pb-4 pt-3 md:px-6">
      <div
        className={`
          flex items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.04]
          px-4 py-3 transition-all duration-200
          focus-within:border-accent-500/40 focus-within:bg-white/[0.06]
          focus-within:ring-2 focus-within:ring-accent-500/10
          ${isDisabled ? "opacity-50" : ""}
        `}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isDisabled ? "Reconnecting..." : "Type a message..."
          }
          disabled={isDisabled}
          rows={1}
          className="max-h-40 flex-1 resize-none bg-transparent text-sm text-surface-100 placeholder-surface-600 outline-none"
        />

        <button
          onClick={handleSubmit}
          disabled={isDisabled || !content.trim()}
          className={`
            flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
            transition-all duration-200
            ${
              content.trim() && !isDisabled
                ? "bg-accent-500 text-white shadow-glow hover:bg-accent-400 hover:scale-105 active:scale-95"
                : "text-surface-600"
            }
          `}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {isDisabled && (
        <p className="mt-2 text-center text-xs text-amber-400/80 animate-pulse-soft">
          Waiting for connection...
        </p>
      )}
    </div>
  );
}

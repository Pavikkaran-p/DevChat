"use client";

import { useEffect, useRef, useCallback } from "react";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { useChatStore, type Message } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";

interface MessageListProps {
  roomId: string;
}

export function MessageList({ roomId }: MessageListProps) {
  const messages = useChatStore((s) => s.messagesByRoom[roomId] || []);
  const typingUsers = useChatStore((s) => s.typingUsers[roomId] || []);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const cursor = useChatStore((s) => s.cursors[roomId]);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const currentUser = useAuthStore((s) => s.user);

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Track if user is near the bottom
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;

    // Infinite scroll up — load older messages
    if (scrollTop < 80 && cursor?.hasMore && cursor.nextCursor && !isLoadingMessages) {
      const composedCursor = `${cursor.nextCursor.createdAt}|${cursor.nextCursor.id}`;
      fetchMessages(roomId, composedCursor);
    }
  }, [roomId, cursor, isLoadingMessages, fetchMessages]);

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 md:px-6"
    >
      {/* Loading indicator at top for pagination */}
      {isLoadingMessages && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-surface-500" />
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 && !isLoadingMessages && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/10">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="text-lg font-semibold text-surface-200">
            No messages yet
          </h3>
          <p className="max-w-xs text-sm text-surface-500">
            Be the first to send a message in this room!
          </p>
        </div>
      )}

      {/* Messages grouped by date */}
      {groupedMessages.map(({ date, messages: dayMessages }) => (
        <div key={date}>
          {/* Date separator */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs font-medium text-surface-500">
              {date}
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          {/* Day's messages */}
          {dayMessages.map((message, i) => {
            const prevMsg = dayMessages[i - 1];
            const isConsecutive =
              prevMsg?.user.id === message.user.id &&
              new Date(message.createdAt).getTime() -
                new Date(prevMsg.createdAt).getTime() <
                120000; // 2 min threshold

            const isOwn = message.user.id === currentUser?.id;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                isConsecutive={isConsecutive}
              />
            );
          })}
        </div>
      ))}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-2 animate-fade-in">
          <div className="flex gap-1">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
          <span className="text-xs text-surface-500">
            {typingUsers.map((u) => u.username).join(", ")}{" "}
            {typingUsers.length === 1 ? "is" : "are"} typing...
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────

function MessageBubble({
  message,
  isOwn,
  isConsecutive,
}: {
  message: Message;
  isOwn: boolean;
  isConsecutive: boolean;
}) {
  const isPending = message.status === "pending";
  const isFailed = message.status === "failed";

  const handleRetry = () => {
    // Re-emit through socket store would go here
    // For now, just a placeholder
  };

  return (
    <div
      className={`group flex gap-3 animate-fade-in ${
        isConsecutive ? "mt-0.5" : "mt-4"
      } ${isOwn ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {!isConsecutive ? (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
            isOwn
              ? "bg-gradient-to-br from-accent-500 to-accent-700"
              : "bg-gradient-to-br from-surface-500 to-surface-700"
          }`}
        >
          {message.user.username[0]?.toUpperCase()}
        </div>
      ) : (
        <div className="w-9 shrink-0" />
      )}

      {/* Content */}
      <div
        className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}
      >
        {!isConsecutive && (
          <div
            className={`mb-1 flex items-center gap-2 ${
              isOwn ? "flex-row-reverse" : ""
            }`}
          >
            <span className="text-sm font-semibold text-surface-200">
              {message.user.username}
            </span>
            <span className="text-[11px] text-surface-600">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        <div
          className={`
            rounded-2xl px-4 py-2.5 text-sm leading-relaxed
            transition-opacity duration-200
            ${
              isOwn
                ? "rounded-tr-md bg-accent-500/20 text-surface-100"
                : "rounded-tl-md bg-white/[0.06] text-surface-200"
            }
            ${isPending ? "opacity-60" : ""}
            ${isFailed ? "border border-red-500/30 opacity-80" : ""}
          `}
        >
          {message.content}

          {/* Failed indicator */}
          {isFailed && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              Failed to send
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-1 underline hover:text-red-300"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

function groupMessagesByDate(
  messages: Message[],
): { date: string; messages: Message[] }[] {
  const groups: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  for (const message of messages) {
    const msgDate = formatDate(message.createdAt);

    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groups.push({ date: msgDate, messages: [message] });
    } else {
      groups[groups.length - 1].messages.push(message);
    }
  }

  return groups;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 86400000;

  if (diff < dayMs && date.getDate() === now.getDate()) return "Today";
  if (diff < 2 * dayMs && date.getDate() === now.getDate() - 1)
    return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

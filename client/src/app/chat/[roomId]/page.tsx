"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Hash } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useSocketStore } from "@/stores/socketStore";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const { rooms, setActiveRoom, fetchMessages } = useChatStore();
  const { joinRoom, leaveRoom, status } = useSocketStore();

  const room = rooms.find((r) => r.id === roomId);

  // Set active room and fetch messages
  useEffect(() => {
    setActiveRoom(roomId);
    fetchMessages(roomId);
  }, [roomId, setActiveRoom, fetchMessages]);

  // Join/leave socket room
  useEffect(() => {
    if (status === "connected") {
      joinRoom(roomId);

      return () => {
        leaveRoom(roomId);
      };
    }
  }, [roomId, status, joinRoom, leaveRoom]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Room header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 md:px-6">
        <Hash className="h-5 w-5 text-surface-500" />
        <div>
          <h2 className="text-sm font-semibold text-surface-100">
            {room?.name || "Loading..."}
          </h2>
          {room?.type && (
            <p className="text-xs text-surface-500">
              {room.type === "GROUP" ? "Group room" : "Direct message"}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList roomId={roomId} />

      {/* Input */}
      <MessageInput roomId={roomId} />
    </div>
  );
}

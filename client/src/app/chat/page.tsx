"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Plus } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { Button } from "@/components/ui/Button";

export default function ChatPage() {
  const router = useRouter();
  const { rooms, isLoadingRooms } = useChatStore();

  // Auto-redirect to first room if available
  useEffect(() => {
    if (!isLoadingRooms && rooms.length > 0) {
      router.replace(`/chat/${rooms[0]!.id}`);
    }
  }, [rooms, isLoadingRooms, router]);

  // Loading state
  if (isLoadingRooms) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
        <p className="text-sm text-surface-500">Loading rooms...</p>
      </div>
    );
  }

  // Empty state - no rooms
  if (rooms.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-glow-violet">
          <MessageSquare className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-surface-100">
            Welcome to DevChat
          </h2>
          <p className="mt-1 text-sm text-surface-500">
            Create or join a room to start chatting
          </p>
        </div>
        <Button
          onClick={() => {
            // The "New Room" button in sidebar can be used
            // Or we can implement a create room modal here
            const event = new CustomEvent("openCreateRoom");
            window.dispatchEvent(event);
          }}
          className="mt-4"
        >
          <Plus className="h-4 w-4" />
          Create Room
        </Button>
      </div>
    );
  }

  // Should not reach here (auto-redirects to first room)
  return null;
}

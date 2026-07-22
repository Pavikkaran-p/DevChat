"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSocketStore } from "@/stores/socketStore";
import { useChatStore } from "@/stores/chatStore";
import { RoomSidebar } from "@/components/chat/RoomSidebar";
import { ConnectionStatus } from "@/components/chat/ConnectionStatus";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const fetchRooms = useChatStore((s) => s.fetchRooms);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Connect socket + fetch rooms when authenticated
  useEffect(() => {
    if (user) {
      connect();
      fetchRooms();

      return () => {
        disconnect();
      };
    }
  }, [user, connect, disconnect, fetchRooms]);

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-mesh">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
          <p className="text-sm text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-950">
      <RoomSidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-end border-b border-white/5 px-4 py-3 md:px-6">
          <ConnectionStatus />
        </div>

        {/* Chat content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Hash,
  Users,
  Plus,
  LogOut,
  X,
  Menu,
  MessageSquare,
} from "lucide-react";
import { useChatStore, type Room } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function RoomSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeRoomId = params?.roomId as string | undefined;

  const { rooms, isLoadingRooms, createRoom } = useChatStore();
  const { user, logout } = useAuthStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setIsCreating(true);
    try {
      const room = await createRoom(newRoomName.trim(), "GROUP");
      setNewRoomName("");
      setShowCreate(false);
      router.push(`/chat/${room.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-glow-violet">
            <MessageSquare className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-gradient">DevChat</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-white/5 hover:text-surface-200 md:hidden transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Create Room */}
      <div className="px-3 pt-4 pb-2">
        {showCreate ? (
          <form
            onSubmit={handleCreateRoom}
            className="space-y-2 animate-fade-in"
          >
            <Input
              placeholder="Room name..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                isLoading={isCreating}
                fullWidth
              >
                Create
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreate(false);
                  setNewRoomName("");
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Room
          </Button>
        )}
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
          Rooms
        </p>

        {isLoadingRooms ? (
          <div className="space-y-2 px-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton h-9 w-full rounded-lg"
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Hash className="h-8 w-8 text-surface-600" />
            <p className="text-sm text-surface-500">No rooms yet</p>
            <p className="text-xs text-surface-600">
              Create one to get started
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {rooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={room.id === activeRoomId}
                onClick={() => {
                  router.push(`/chat/${room.id}`);
                  setIsMobileOpen(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="border-t border-white/5 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-600 to-glow-violet text-sm font-bold text-white">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-surface-100">
              {user?.username}
            </p>
            <p className="text-xs text-surface-500">Online</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-surface-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-xl glass p-2.5 text-surface-300 hover:text-surface-100 md:hidden transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 glass-strong
          transform transition-transform duration-300 ease-out
          md:relative md:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// ─── Room Item ─────────────────────────────────────────────────────

function RoomItem({
  room,
  isActive,
  onClick,
}: {
  room: Room;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = room.type === "DIRECT" ? Users : Hash;

  return (
    <button
      onClick={onClick}
      className={`
        group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2
        text-left transition-all duration-200
        ${
          isActive
            ? "bg-accent-500/15 text-accent-400 shadow-inner-glow"
            : "text-surface-300 hover:bg-white/5 hover:text-surface-100"
        }
      `}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${
          isActive ? "text-accent-400" : "text-surface-500 group-hover:text-surface-400"
        }`}
      />
      <span className="truncate text-sm font-medium">{room.name}</span>
    </button>
  );
}

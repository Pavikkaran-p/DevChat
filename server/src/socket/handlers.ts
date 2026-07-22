import type { Server, Socket } from "socket.io";
import * as roomService from "../services/room.service.js";
import type { AuthenticatedSocketData } from "./auth.js";

interface JoinRoomPayload {
  roomId: string;
}

interface SendMessagePayload {
  roomId: string;
  content: string;
  tempId?: string;
}

interface TypingPayload {
  roomId: string;
}

function getUser(socket: Socket): AuthenticatedSocketData["user"] {
  return (socket.data as AuthenticatedSocketData).user;
}

export function registerHandlers(io: Server, socket: Socket): void {
  const user = getUser(socket);

  socket.on("join_room", async (payload: JoinRoomPayload) => {
    try {
      const { roomId } = payload;

      if (!roomId) {
        socket.emit("error", { message: "roomId is required" });
        return;
      }

      const isMember = await roomService.verifyMembership(user.userId, roomId);
      if (!isMember) {
        socket.emit("error", { message: "You are not a member of this room" });
        return;
      }

      await socket.join(roomId);

      io.to(roomId).emit("user_joined", {
        userId: user.userId,
        username: user.username,
        roomId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[Socket:join_room] Error:", err);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("send_message", async (payload: SendMessagePayload) => {
    try {
      const { roomId, content, tempId } = payload;

      if (!roomId || !content?.trim()) {
        socket.emit("error", {
          message: "roomId and non-empty content are required",
        });
        return;
      }

      const isMember = await roomService.verifyMembership(user.userId, roomId);
      if (!isMember) {
        socket.emit("error", { message: "You are not a member of this room" });
        return;
      }

      const message = await roomService.createMessage(
        user.userId,
        roomId,
        content.trim(),
      );

      const messagePayload = {
        id: message.id,
        content: message.content,
        roomId: message.roomId,
        user: message.user,
        createdAt: message.createdAt.toISOString(),
      };

      // Acknowledge to sender for optimistic update reconciliation
      if (tempId) {
        socket.emit("message_ack", { tempId, message: messagePayload });
      }

      // Broadcast to room (excluding sender, who already has the optimistic message)
      socket.to(roomId).emit("new_message", messagePayload);
    } catch (err) {
      console.error("[Socket:send_message] Error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing", (payload: TypingPayload) => {
    const { roomId } = payload;

    if (!roomId) return;

    socket.to(roomId).emit("typing", {
      userId: user.userId,
      username: user.username,
      roomId,
    });
  });

  socket.on("disconnect", () => {
    // Broadcast user_left to all rooms this socket was in
    for (const roomId of socket.rooms) {
      // Skip the default room (socket's own ID)
      if (roomId === socket.id) continue;

      socket.to(roomId).emit("user_left", {
        userId: user.userId,
        username: user.username,
        roomId,
        timestamp: new Date().toISOString(),
      });
    }
  });
}

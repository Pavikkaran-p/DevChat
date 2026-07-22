import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type { RoomType } from "@prisma/client";

const DEFAULT_PAGE_SIZE = 50;

export interface CreateRoomInput {
  name: string;
  type?: RoomType;
}

export async function getUserRooms(userId: string) {
  const memberships = await prisma.roomMember.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          members: {
            include: {
              user: { select: { id: true, username: true } },
            },
          },
          _count: { select: { messages: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.room,
    members: m.room.members.map((member) => ({
      id: member.id,
      userId: member.user.id,
      username: member.user.username,
      joinedAt: member.joinedAt,
    })),
    messageCount: m.room._count.messages,
  }));
}

export async function createRoom(userId: string, input: CreateRoomInput) {
  if (!input.name || input.name.trim().length === 0) {
    throw new AppError("Room name is required", 400);
  }

  if (input.name.length > 100) {
    throw new AppError("Room name must be 100 characters or less", 400);
  }

  const room = await prisma.room.create({
    data: {
      name: input.name.trim(),
      type: input.type ?? "GROUP",
      members: {
        create: { userId },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true } },
        },
      },
    },
  });

  return {
    ...room,
    members: room.members.map((member) => ({
      id: member.id,
      userId: member.user.id,
      username: member.user.username,
      joinedAt: member.joinedAt,
    })),
  };
}

export interface PaginationCursor {
  createdAt?: string;
  id?: string;
}

export async function getRoomMessages(
  userId: string,
  roomId: string,
  cursor?: PaginationCursor,
  limit: number = DEFAULT_PAGE_SIZE,
) {
  // Verify user is a member of the room
  const membership = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });

  if (!membership) {
    throw new AppError("You are not a member of this room", 403);
  }

  const take = Math.min(limit, 100);

  const messages = await prisma.message.findMany({
    where: {
      roomId,
      ...(cursor?.createdAt && cursor?.id
        ? {
            OR: [
              { createdAt: { lt: new Date(cursor.createdAt) } },
              {
                createdAt: { equals: new Date(cursor.createdAt) },
                id: { lt: cursor.id },
              },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, username: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1, // Fetch one extra to determine if more exist
  });

  const hasMore = messages.length > take;
  const items = hasMore ? messages.slice(0, take) : messages;
  const nextCursor =
    hasMore && items.length > 0
      ? {
          createdAt: items[items.length - 1]!.createdAt.toISOString(),
          id: items[items.length - 1]!.id,
        }
      : null;

  return { messages: items, hasMore, nextCursor };
}

export async function verifyMembership(
  userId: string,
  roomId: string,
): Promise<boolean> {
  const membership = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  return !!membership;
}

export async function createMessage(
  userId: string,
  roomId: string,
  content: string,
) {
  const message = await prisma.message.create({
    data: { content, roomId, userId },
    include: {
      user: { select: { id: true, username: true } },
    },
  });

  return message;
}

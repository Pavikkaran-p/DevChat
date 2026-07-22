import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import * as roomService from "../services/room.service.js";

const router = Router();

// All room routes require authentication
router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const rooms = await roomService.getUserRooms(req.user!.userId);
    res.json({ status: "success", data: { rooms } });
  }),
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, type } = req.body as {
      name: string;
      type?: "DIRECT" | "GROUP";
    };

    const room = await roomService.createRoom(req.user!.userId, {
      name,
      type,
    });

    res.status(201).json({ status: "success", data: { room } });
  }),
);

router.get(
  "/:id/messages",
  asyncHandler(async (req: Request, res: Response) => {
    const { id: roomId } = req.params;
    const { cursor_created_at, cursor_id, limit } = req.query as {
      cursor_created_at?: string;
      cursor_id?: string;
      limit?: string;
    };

    const cursor =
      cursor_created_at && cursor_id
        ? { createdAt: cursor_created_at, id: cursor_id }
        : undefined;

    const result = await roomService.getRoomMessages(
      req.user!.userId,
      roomId!,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );

    res.json({ status: "success", data: result });
  }),
);

export default router;

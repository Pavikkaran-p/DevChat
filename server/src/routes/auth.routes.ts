import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import * as authService from "../services/auth.service.js";
import { config } from "../config/env.js";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };

    const { user, token } = await authService.register(username, password);

    res.cookie("token", token, COOKIE_OPTIONS);
    res.status(201).json({ status: "success", data: { user } });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };

    const { user, token } = await authService.login(username, password);

    res.cookie("token", token, COOKIE_OPTIONS);
    res.json({ status: "success", data: { user } });
  }),
);

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax" as const,
    path: "/",
  });
  res.json({ status: "success", data: null });
});

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.userId);
    res.json({ status: "success", data: { user } });
  }),
);

export default router;

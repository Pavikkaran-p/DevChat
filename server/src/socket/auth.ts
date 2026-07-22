import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import type { JwtPayload } from "../middleware/auth.js";

export interface AuthenticatedSocketData {
  user: JwtPayload;
}

function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.substring(0, idx).trim();
    const value = decodeURIComponent(pair.substring(idx + 1).trim());
    if (key) cookies[key] = value;
  }
  return cookies;
}

/**
 * Socket.io middleware that authenticates incoming connections by parsing
 * the JWT from the handshake cookie header.
 */
export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): void {
  try {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      return next(new Error("Authentication required: no cookies provided"));
    }

    const cookies = parseCookies(cookieHeader);
    const token = cookies["token"];

    if (!token) {
      return next(new Error("Authentication required: no token cookie"));
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    socket.data = { user: decoded } satisfies AuthenticatedSocketData;
    next();
  } catch {
    next(new Error("Authentication failed: invalid or expired token"));
  }
}

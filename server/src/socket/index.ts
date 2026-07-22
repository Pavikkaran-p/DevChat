import { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisPub, redisSub } from "../lib/redis.js";
import { config } from "../config/env.js";
import { socketAuthMiddleware } from "./auth.js";
import { registerHandlers } from "./handlers.js";

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Attach Redis adapter for horizontal scaling
  io.adapter(createAdapter(redisPub, redisSub));

  // Auth middleware — runs once per connection
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log(
      `[Socket] Connected: ${socket.data.user.username} (${socket.id})`,
    );

    registerHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket] Disconnected: ${socket.data.user.username} (${reason})`,
      );
    });
  });

  console.log("[Socket.io] Initialized with Redis adapter");

  return io;
}

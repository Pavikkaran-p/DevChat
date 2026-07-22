import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config/env.js";

const app = express();
const httpServer = createServer(app);

// ── Security & parsing middleware ──────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health check ───────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});


// ── Start server ───────────────────────────────────────────────────────
httpServer.listen(config.port, () => {
  console.log(
    `[DevChat] Server running on port ${config.port} (${config.nodeEnv})`,
  );
});

// ── Graceful shutdown ──────────────────────────────────────────────────
function gracefulShutdown(signal: string) {
  console.log(`\n[DevChat] ${signal} received. Shutting down gracefully...`);
  httpServer.close(() => {
    console.log("[DevChat] HTTP server closed");
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error("[DevChat] Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;

import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export interface AppConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  clientUrl: string;
  nodeEnv: string;
  isProduction: boolean;
}

export const config: AppConfig = {
  port: parseInt(process.env["PORT"] ?? "4000", 10),
  databaseUrl: requireEnv("DATABASE_URL"),
  redisUrl: process.env["REDIS_URL"] ?? "redis://localhost:6379",
  jwtSecret: requireEnv("JWT_SECRET"),
  clientUrl: process.env["CLIENT_URL"] ?? "http://localhost:3000",
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  get isProduction() {
    return this.nodeEnv === "production";
  },
};

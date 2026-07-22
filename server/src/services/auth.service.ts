import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { config } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import type { JwtPayload } from "../middleware/auth.js";

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = "7d";
const USERNAME_REGEX = /^[a-zA-Z0-9]{3,20}$/;
const MIN_PASSWORD_LENGTH = 8;

export interface AuthResult {
  user: { id: string; username: string; createdAt: Date };
  token: string;
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: JWT_EXPIRY });
}

export async function register(
  username: string,
  password: string,
): Promise<AuthResult> {
  if (!USERNAME_REGEX.test(username)) {
    throw new AppError(
      "Username must be 3-20 alphanumeric characters",
      400,
    );
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      400,
    );
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new AppError("Username already taken", 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: { username, passwordHash },
    select: { id: true, username: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, username: user.username });

  return { user, token };
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResult> {
  if (!username || !password) {
    throw new AppError("Username and password are required", 400);
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new AppError("Invalid username or password", 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid username or password", 401);
  }

  const token = signToken({ userId: user.id, username: user.username });

  return {
    user: { id: user.id, username: user.username, createdAt: user.createdAt },
    token,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, createdAt: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

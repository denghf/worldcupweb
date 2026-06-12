import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "hiqi-jwt-secret-change-in-production-2026";
const SECRET = new TextEncoder().encode(JWT_SECRET);
const TOKEN_NAME = "token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // admin: 7 days

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123456";

export type AuthPayload = {
  role: "ADMIN" | "PLAYER";
  userId?: number;
};

export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function signToken(payload: AuthPayload, expiresIn = "7d"): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
    return payload as AuthPayload;
  } catch {
    return null;
  }
}

export async function setTokenCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: TOKEN_MAX_AGE,
    path: "/",
  });
}

export async function removeTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

export async function getCurrentAdmin(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.role === "ADMIN" ? payload : null;
}

export async function getCurrentPlayer(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.role === "PLAYER" && payload.userId ? payload : null;
}

export async function getCurrentPlayerFromRequest(req: NextRequest): Promise<AuthPayload | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.role === "PLAYER" && payload.userId ? payload : null;
}

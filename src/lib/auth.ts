import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "hiqi-jwt-secret-change-in-production-2026";
const SECRET = new TextEncoder().encode(JWT_SECRET);
const TOKEN_NAME = "token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123456";

export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function signToken(payload: { role: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
    return payload as { role: string };
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

export async function getCurrentAdmin(): Promise<{ role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const { username: rawUsername, password } = await req.json();
    const username = String(rawUsername ?? "").trim();
    if (!username || !password) return apiError("用户名和密码不能为空");

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.role !== "PLAYER" || user.status !== "ACTIVE" || !user.password) {
      return apiError("用户名或密码错误");
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return apiError("用户名或密码错误");

    const token = await signToken({ role: "PLAYER", userId: user.id }, "60d");

    return apiSuccess({
      token,
      expiresInDays: 60,
      id: user.id,
      nickname: user.nickname,
      mustChangePwd: user.mustChangePwd,
    });
  } catch (e) {
    console.error("Player login error:", e);
    return apiError("登录失败，请稍后重试", 500);
  }
}

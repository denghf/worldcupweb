import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentPlayerFromRequest } from "@/lib/auth";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const player = await getCurrentPlayerFromRequest(req);
    if (!player?.userId) return apiUnauthorized();

    const { newPassword } = await req.json();
    if (!newPassword || String(newPassword).length < 6) return apiError("密码至少 6 位");

    const password = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { id: player.userId },
      data: { password, mustChangePwd: false },
    });

    return apiSuccess({ message: "密码设置成功" });
  } catch (e) {
    console.error("Change password error:", e);
    return apiError("修改密码失败", 500);
  }
}

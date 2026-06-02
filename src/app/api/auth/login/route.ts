import { NextRequest } from "next/server";
import { verifyAdminCredentials, signToken, setTokenCookie } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return apiError("用户名和密码不能为空");
    }

    if (!verifyAdminCredentials(username, password)) {
      return apiError("用户名或密码错误");
    }

    const token = await signToken({ role: "ADMIN" });
    await setTokenCookie(token);

    return apiSuccess({
      username,
      role: "ADMIN",
    });
  } catch {
    return apiError("登录失败，请稍后重试", 500);
  }
}

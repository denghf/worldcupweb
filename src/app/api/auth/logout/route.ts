import { removeTokenCookie } from "@/lib/auth";
import { apiSuccess } from "@/lib/response";

export async function POST() {
  await removeTokenCookie();
  return apiSuccess({ message: "已退出登录" });
}

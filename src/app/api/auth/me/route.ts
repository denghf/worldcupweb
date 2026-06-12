import { NextRequest } from "next/server";
import { getCurrentPlayerFromRequest } from "@/lib/auth";
import { apiSuccess } from "@/lib/response";

export async function GET(req: NextRequest) {
  const player = await getCurrentPlayerFromRequest(req);
  return apiSuccess({ loggedIn: Boolean(player?.userId), userId: player?.userId ?? null });
}

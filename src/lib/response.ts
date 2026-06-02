import { NextResponse } from "next/server";

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function apiUnauthorized() {
  return apiError("请先登录", 401);
}

export function apiForbidden() {
  return apiError("无权限访问", 403);
}

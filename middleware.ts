import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/* 는 리다이렉트 대신 401 반환
  const isApiRoute = pathname.startsWith("/api/");
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    const response = isApiRoute
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 아래 경로는 미들웨어 제외:
     * - _next/static, _next/image (정적 파일)
     * - favicon.ico
     * - /login, /signup (인증 페이지)
     * - /api/auth/* (인증 API)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|login|signup|api/auth).*)",
  ],
};

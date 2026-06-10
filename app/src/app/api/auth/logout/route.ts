import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh-token")?.value;

    if (refreshToken) {
      await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          Cookie: `refresh-token=${refreshToken}`,
        },
      }).catch(() => {
        // Ignorar errores del backend en logout
      });
    }

    const response = NextResponse.json({ success: true });
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 0,
      path: "/",
    };
    response.cookies.set("refresh-token", "", cookieOpts);
    response.cookies.set("access-token", "", cookieOpts);

    return response;
  } catch {
    return NextResponse.json({ success: true });
  }
}

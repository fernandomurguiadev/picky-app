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
    // Eliminar la cookie del refresh token
    response.cookies.set("refresh-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ success: true });
  }
}

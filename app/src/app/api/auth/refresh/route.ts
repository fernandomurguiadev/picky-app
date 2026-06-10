import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

function parseJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const buffer = Buffer.from(parts[1]!, "base64");
    return JSON.parse(buffer.toString("utf-8"));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh-token")?.value;

    const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(refreshToken ? { Cookie: `refresh-token=${refreshToken}` } : {}),
      },
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const accessToken = data.data?.access_token ?? data.access_token;
    const claims = parseJwt(accessToken);

    const response = NextResponse.json({
      tenantId: claims?.tenantId,
      role: claims?.role,
    });

    // Forward all Set-Cookie headers (rotated refresh-token + new access-token)
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno" } },
      { status: 500 }
    );
  }
}

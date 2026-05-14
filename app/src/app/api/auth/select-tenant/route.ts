import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const selectTenantSchema = z.object({
  selectionToken: z.string().min(1),
  tenantId: z.string().uuid(),
});

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

function parseJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1]!;
    const buffer = Buffer.from(base64Url, "base64");
    return JSON.parse(buffer.toString("utf-8"));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = selectTenantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos" } },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/select-tenant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      credentials: "include",
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const payload = data.data ?? data;
    const accessToken = payload.access_token;
    const claims = parseJwt(accessToken);

    const response = NextResponse.json({
      access_token: accessToken,
      tenantId: claims?.tenantId,
      role: claims?.role,
    });

    // Forward Set-Cookie for rotated refresh token
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } },
      { status: 500 }
    );
  }
}

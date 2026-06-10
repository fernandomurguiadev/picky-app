import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[impersonate/exchange] body:", body);

    const backendRes = await fetch(
      `${BACKEND_URL}/api/v1/auth/impersonate/exchange`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const json = await backendRes.json();
    console.log("[impersonate/exchange] backend status:", backendRes.status, "json:", JSON.stringify(json));

    if (!backendRes.ok) {
      return NextResponse.json(json, { status: backendRes.status });
    }

    const payload = json.data ?? json;
    console.log("[impersonate/exchange] payload:", payload);

    const response = NextResponse.json({
      tenantId: payload.tenantId,
      role: payload.role,
    });

    const setCookie = backendRes.headers.get("set-cookie");
    console.log("[impersonate/exchange] set-cookie:", setCookie);
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (err) {
    console.error("[impersonate/exchange] error:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

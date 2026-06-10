import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  try {
    const cookies = req.headers.get("cookie") ?? "";

    const backendRes = await fetch(
      `${BACKEND_URL}/api/v1/auth/impersonate/end`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies,
        },
      }
    );

    const json = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(json, { status: backendRes.status });
    }

    const response = NextResponse.json(json.data ?? json);

    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch {
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

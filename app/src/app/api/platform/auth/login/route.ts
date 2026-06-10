import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const body = await req.arrayBuffer();

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/platform/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await backendRes.arrayBuffer();
  const res = new NextResponse(data, {
    status: backendRes.status,
    headers: { "Content-Type": "application/json" },
  });

  const setCookie = backendRes.headers.get("set-cookie");
  if (setCookie) res.headers.set("Set-Cookie", setCookie);

  return res;
}

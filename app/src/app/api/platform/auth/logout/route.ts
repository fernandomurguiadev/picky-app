import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get("platform-access-token")?.value;

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/platform/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  const res = new NextResponse(null, { status: backendRes.status });

  const setCookie = backendRes.headers.get("set-cookie");
  if (setCookie) res.headers.set("Set-Cookie", setCookie);

  return res;
}

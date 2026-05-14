import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const backendPath = path.join("/");
  const url = new URL(req.url);

  // Evitar duplicación de api/v1 en el ruteo del BFF
  const normalizedPath = backendPath.startsWith("api/v1")
    ? backendPath.replace(/^api\/v1\/?/, "")
    : backendPath;

  const backendUrl = `${BACKEND_URL}/api/v1/${normalizedPath}${url.search}`;

  const refreshToken = req.cookies.get("refresh-token")?.value;
  const authHeader = req.headers.get("authorization");

  const headers: HeadersInit = {
    "Content-Type": req.headers.get("content-type") ?? "application/json",
  };

  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  if (refreshToken) {
    headers["Cookie"] = `refresh-token=${refreshToken}`;
  }

  let body: BodyInit | null = null;
  if (!["GET", "HEAD"].includes(req.method)) {
    body = await req.arrayBuffer();
  }

  const backendRes = await fetch(backendUrl, {
    method: req.method,
    headers,
    body: body ?? undefined,
  });

  const responseData = await backendRes.arrayBuffer();

  return new NextResponse(responseData, {
    status: backendRes.status,
    headers: {
      "Content-Type": backendRes.headers.get("content-type") ?? "application/json",
    },
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };

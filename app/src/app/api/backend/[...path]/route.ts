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

  const accessToken = req.cookies.get("access-token")?.value;
  const refreshToken = req.cookies.get("refresh-token")?.value;

  const headers: HeadersInit = {
    "Content-Type": req.headers.get("content-type") ?? "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
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

  // 101, 204, 205, 304 are null-body statuses — the Response constructor
  // throws if you pass a body (even an empty ArrayBuffer) for these codes.
  const isNullBody = [101, 204, 205, 304].includes(backendRes.status);

  const responseHeaders: HeadersInit = {};

  if (!isNullBody) {
    responseHeaders["Content-Type"] =
      backendRes.headers.get("content-type") ?? "application/json";
  }

  // Forward Set-Cookie if the backend sets cookies (e.g. rotating/updating refresh tokens during tenant switch)
  const setCookie = backendRes.headers.get("set-cookie");
  if (setCookie) {
    responseHeaders["Set-Cookie"] = setCookie;
  }

  if (isNullBody) {
    return new NextResponse(null, {
      status: backendRes.status,
      headers: responseHeaders,
    });
  }

  const responseData = await backendRes.arrayBuffer();
  return new NextResponse(responseData, {
    status: backendRes.status,
    headers: responseHeaders,
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };

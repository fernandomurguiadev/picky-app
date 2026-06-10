import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";
const NULL_BODY_STATUSES = [101, 204, 205, 304];

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = req.nextUrl;

  const backendUrl = `${BACKEND_URL}/api/v1/platform/${path.join("/")}${url.search}`;

  const accessToken = req.cookies.get("platform-access-token")?.value;

  // Forward platform-prefixed cookies so the backend can read them (e.g. platform-mfa-pending)
  const platformCookies = [...req.cookies.getAll()]
    .filter((c) => c.name.startsWith("platform-"))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const headers: HeadersInit = {
    "Content-Type": req.headers.get("content-type") ?? "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(platformCookies ? { Cookie: platformCookies } : {}),
  };

  let body: BodyInit | null = null;
  if (!["GET", "HEAD"].includes(req.method)) {
    body = await req.arrayBuffer();
  }

  const backendRes = await fetch(backendUrl, {
    method: req.method,
    headers,
    body: body ?? undefined,
  });

  const isNullBody = NULL_BODY_STATUSES.includes(backendRes.status);
  const backendContentType = backendRes.headers.get("content-type") ?? "";

  // Reject non-JSON responses to prevent content-type confusion attacks
  if (!isNullBody && !backendContentType.includes("application/json")) {
    return NextResponse.json(
      { message: "Respuesta inválida del servidor" },
      { status: 502 }
    );
  }

  const resHeaders: HeadersInit = {};
  if (!isNullBody) {
    resHeaders["Content-Type"] = "application/json";
  }

  const setCookie = backendRes.headers.get("set-cookie");
  if (setCookie) resHeaders["Set-Cookie"] = setCookie;

  if (isNullBody) {
    return new NextResponse(null, {
      status: backendRes.status,
      headers: resHeaders,
    });
  }

  const data = await backendRes.arrayBuffer();
  return new NextResponse(data, {
    status: backendRes.status,
    headers: resHeaders,
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};

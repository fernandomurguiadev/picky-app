import { NextRequest, NextResponse } from "next/server";

/**
 * Retorna el access-token desde la cookie httpOnly para uso exclusivo del WebSocket.
 * El WS conecta directo al backend (no por BFF), por lo que no puede usar la cookie.
 * Este endpoint sólo es accesible desde el mismo origen con una sesión válida.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("access-token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sin sesión activa" } },
      { status: 401 }
    );
  }

  return NextResponse.json({ token });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Email inválido" } },
        { status: 400 }
      );
    }

    await fetch(`${BACKEND_URL}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    }).catch(() => { /* ignorar errores — respuesta siempre 200 */ });

    // Siempre retornar 200 por seguridad (no revelar si el email existe)
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

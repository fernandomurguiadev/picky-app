import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
  phone: z.string().optional(),
});

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { businessName, email, password } = parsed.data;

    // Generar slug válido desde el nombre del negocio (remueve acentos, caracteres especiales, y une con guiones)
    const slug = businessName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^a-z0-9]+/g, "-")     // Reemplazar no-alfanuméricos por guión
      .replace(/(^-|-$)+/g, "")        // Limpiar guiones iniciales/finales
      || "tienda";                     // Fallback seguro

    const backendPayload = {
      email,
      password,
      storeName: businessName,
      slug: slug.length < 3 ? `${slug}-store` : slug, // Forzar longitud mínima de 3
    };

    const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendPayload),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const response = NextResponse.json({
      access_token: data.data?.access_token ?? data.access_token,
      tenantId: data.data?.tenantId ?? data.tenantId,
      role: data.data?.role ?? data.role,
    });

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

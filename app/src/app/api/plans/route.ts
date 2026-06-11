import { NextResponse } from "next/server";

const BACKEND_URL = process.env["BACKEND_URL"] ?? "http://localhost:3001";

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/api/v1/public/plans`, {
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const json = await res.json();
  const plans = json.data ?? json;
  return NextResponse.json(plans);
}

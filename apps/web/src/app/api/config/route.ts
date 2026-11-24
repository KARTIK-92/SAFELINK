import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "https://safelink-api-zuiu.onrender.com").replace(/\/+$/, "");
  const apiUrl = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

  return NextResponse.json({
    status: "ok",
    app: "SafeLink",
    api_url: apiUrl,
    emergency_phone: process.env.NEXT_PUBLIC_EMERGENCY_PHONE || "112",
  });
}

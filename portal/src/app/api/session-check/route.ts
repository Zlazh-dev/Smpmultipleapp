import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();

  // Create response
  const response = NextResponse.json({ 
    valid: !!session?.user,
    userId: session?.user?.id || null 
  });

  // Allow CORS
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_TU_URL || "http://tu.localhost";
  
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control");

  // Prevent caching of this endpoint
  response.headers.set("Cache-Control", "no-store, max-age=0");

  return response;
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_TU_URL || "http://tu.localhost";
  
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control");
  
  return response;
}

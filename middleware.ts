import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth disabilitata — middleware passthrough
// TODO: reimplementare auth con Google Sheets se necessario
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

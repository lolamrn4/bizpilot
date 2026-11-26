import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!api/billing/webhook|_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.webmanifest|offline|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};

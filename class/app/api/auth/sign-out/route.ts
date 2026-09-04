import { NextResponse } from "next/server";

import { clearSessionCookies } from "@/server/session";

export async function POST(request: Request) {
  await clearSessionCookies();
  return NextResponse.redirect(new URL("/class/sign-in", request.url), {
    status: 303,
  });
}

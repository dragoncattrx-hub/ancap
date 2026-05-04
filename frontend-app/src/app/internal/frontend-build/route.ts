import { NextResponse } from "next/server";

/** Not secret: proves which Docker image is serving (compare to `git rev-parse --short HEAD`). */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_APP_BUILD_ID: process.env.NEXT_PUBLIC_APP_BUILD_ID ?? null,
  });
}

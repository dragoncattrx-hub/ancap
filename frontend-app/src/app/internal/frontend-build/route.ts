import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/** Not secret: proves which Docker image is serving (compare to `git rev-parse --short HEAD`). */
export const dynamic = "force-dynamic";

function normalizeBuildId(value: string | null | undefined): string | null {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === "unknown") return null;
  return trimmed;
}

async function readNextBuildId(): Promise<string | null> {
  try {
    const buildId = await readFile(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8");
    return normalizeBuildId(buildId);
  } catch {
    return null;
  }
}

export async function GET() {
  const envBuildId = normalizeBuildId(process.env.NEXT_PUBLIC_APP_BUILD_ID);
  const fileBuildId = await readNextBuildId();
  const effectiveBuildId = fileBuildId || envBuildId || null;
  const buildIdSource = fileBuildId ? "next-build-id-file" : envBuildId ? "env" : null;

  return NextResponse.json({
    NEXT_PUBLIC_APP_BUILD_ID: effectiveBuildId,
    build_id_source: buildIdSource,
    next_public_app_build_id_env: envBuildId,
    next_build_id_file: fileBuildId,
  });
}

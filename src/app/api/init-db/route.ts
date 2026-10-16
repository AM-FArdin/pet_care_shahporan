import { isDbConfigured } from "@/lib/db";
import { ensureTablesExist } from "@/lib/db/init";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json(
      {
        success: false,
        error: "DATABASE_URL is not set or still has the placeholder value in your environment variables.",
        configured: false,
      },
      { status: 400 }
    );
  }

  try {
    await ensureTablesExist();
    return NextResponse.json({
      success: true,
      message: "Database tables created and initialized successfully!",
      configured: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Database initialization failed: ${message}`,
        configured: true,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

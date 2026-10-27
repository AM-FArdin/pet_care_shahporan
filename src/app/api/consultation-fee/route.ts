import { db, isDbConfigured } from "@/lib/db";
import { consultationSettings } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const [setting] = await db.select().from(consultationSettings).orderBy(desc(consultationSettings.id)).limit(1);
    return NextResponse.json({ consultationFee: setting?.consultationFee ?? "0.00" });
  } catch (error) {
    console.error("Error reading consultation fee:", error);
    return NextResponse.json({ error: "Failed to fetch consultation fee" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const { consultationFee } = await req.json();
    const fee = Number(consultationFee);
    if (!Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: "Fee must be a non-negative number." }, { status: 400 });
    const [latest] = await db.select().from(consultationSettings).orderBy(desc(consultationSettings.id)).limit(1);
    if (latest) {
      await db.update(consultationSettings).set({ consultationFee: fee.toFixed(2), updatedAt: new Date() }).where(eq(consultationSettings.id, latest.id));
    } else {
      await db.insert(consultationSettings).values({ consultationFee: fee.toFixed(2) });
    }
    return NextResponse.json({ consultationFee: fee.toFixed(2) });
  } catch (error) {
    console.error("Error updating consultation fee:", error);
    return NextResponse.json({ error: "Failed to update consultation fee" }, { status: 500 });
  }
}

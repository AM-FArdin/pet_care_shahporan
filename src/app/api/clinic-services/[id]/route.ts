import { db, isDbConfigured } from "@/lib/db";
import { clinicServices } from "@/lib/db/schema";
import { ensureTablesExist } from "@/lib/db/init";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const id = Number((await params).id);
    const body = await req.json();
    const fee = Number(body.fee);
    if (!Number.isInteger(id) || !Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: "Invalid service fee." }, { status: 400 });
    let updated;
    try {
      [updated] = await db.update(clinicServices).set({ fee: fee.toFixed(2), updatedAt: new Date() }).where(eq(clinicServices.id, id)).returning();
    } catch {
      await ensureTablesExist();
      [updated] = await db.update(clinicServices).set({ fee: fee.toFixed(2), updatedAt: new Date() }).where(eq(clinicServices.id, id)).returning();
    }
    if (!updated) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating clinic service:", error);
    return NextResponse.json({ error: "Failed to update clinic service" }, { status: 500 });
  }
}

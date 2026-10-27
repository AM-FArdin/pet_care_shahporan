import { db, isDbConfigured } from "@/lib/db";
import { appointments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const id = Number((await params).id);
    const { status } = await req.json();
    const allowed = ["scheduled", "completed", "cancelled", "no-show"];
    if (!Number.isInteger(id) || !allowed.includes(status)) return NextResponse.json({ error: "Invalid appointment status." }, { status: 400 });
    const [updated] = await db.update(appointments).set({ status, updatedAt: new Date() }).where(eq(appointments.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

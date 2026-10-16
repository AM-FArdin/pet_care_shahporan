import { db, isDbConfigured } from "@/lib/db";
import { medicalRecords } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const recordId = Number(id);
  if (!Number.isInteger(recordId)) {
    return NextResponse.json({ error: "Invalid medical record ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.visitDate !== undefined) {
      const visitDate = String(body.visitDate).trim();
      if (!visitDate) {
        return NextResponse.json({ error: "Visit date is required." }, { status: 400 });
      }
      updateData.visitDate = visitDate;
    }
    if (body.visitType !== undefined) {
      const visitType = String(body.visitType).trim();
      if (!visitType) {
        return NextResponse.json({ error: "Visit type is required." }, { status: 400 });
      }
      updateData.visitType = visitType;
    }
    if (body.diagnosis !== undefined) updateData.diagnosis = body.diagnosis?.trim() || null;
    if (body.treatment !== undefined) updateData.treatment = body.treatment?.trim() || null;
    if (body.prescription !== undefined) updateData.prescription = body.prescription?.trim() || null;
    if (body.weight !== undefined) updateData.weight = body.weight?.trim() || null;
    if (body.temperature !== undefined) updateData.temperature = body.temperature?.trim() || null;
    if (body.nextVisitDate !== undefined) updateData.nextVisitDate = body.nextVisitDate?.trim() || null;
    if (body.attendingDoctor !== undefined) updateData.attendingDoctor = body.attendingDoctor?.trim() || null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No clinical record updates provided." }, { status: 400 });
    }

    const [updated] = await db
      .update(medicalRecords)
      .set(updateData)
      .where(eq(medicalRecords.id, recordId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Medical record not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error updating medical record:", error);
    const message = error instanceof Error ? error.message : "Failed to update medical record";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    await db.delete(medicalRecords).where(eq(medicalRecords.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete medical record" }, { status: 500 });
  }
}

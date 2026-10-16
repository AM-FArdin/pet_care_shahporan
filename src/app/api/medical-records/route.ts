import { db, isDbConfigured } from "@/lib/db";
import { medicalRecords } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const petId = Number(body.petId);

    if (!body.visitDate?.trim() || !body.visitType?.trim() || isNaN(petId)) {
      return NextResponse.json(
        { error: "Visit date, visit type, and valid pet ID are required." },
        { status: 400 }
      );
    }

    const [record] = await db
      .insert(medicalRecords)
      .values({
        petId,
        visitDate: body.visitDate.trim(),
        visitType: body.visitType.trim(),
        diagnosis: body.diagnosis?.trim() || null,
        treatment: body.treatment?.trim() || null,
        prescription: body.prescription?.trim() || null,
        weight:
          body.weight !== undefined && body.weight !== null && String(body.weight).trim() !== ""
            ? String(body.weight).trim()
            : null,
        temperature:
          body.temperature !== undefined && body.temperature !== null && String(body.temperature).trim() !== ""
            ? String(body.temperature).trim()
            : null,
        nextVisitDate: body.nextVisitDate?.trim() || null,
        attendingDoctor: body.attendingDoctor?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .returning();

    return NextResponse.json(record, { status: 201 });
  } catch (error: unknown) {
    console.error("Error adding medical record:", error);
    const message = error instanceof Error ? error.message : "Failed to add medical record";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

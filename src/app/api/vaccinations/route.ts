import { db, isDbConfigured } from "@/lib/db";
import { vaccinations } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const petId = Number(body.petId);

    if (!body.vaccineName?.trim() || !body.dateAdministered?.trim() || isNaN(petId)) {
      return NextResponse.json(
        { error: "Vaccine name, administered date, and valid pet ID are required." },
        { status: 400 }
      );
    }

    const [vax] = await db
      .insert(vaccinations)
      .values({
        petId,
        vaccineName: body.vaccineName.trim(),
        dateAdministered: body.dateAdministered.trim(),
        dueDate: body.dueDate?.trim() || null,
        batchNumber: body.batchNumber?.trim() || null,
        administeredBy: body.administeredBy?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .returning();

    return NextResponse.json(vax, { status: 201 });
  } catch (error: unknown) {
    console.error("Error adding vaccination:", error);
    const message = error instanceof Error ? error.message : "Failed to add vaccination";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

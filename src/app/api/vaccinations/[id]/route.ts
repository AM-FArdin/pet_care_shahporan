import { db, isDbConfigured } from "@/lib/db";
import { vaccinations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const vaccinationId = Number(id);
  if (!Number.isInteger(vaccinationId)) {
    return NextResponse.json({ error: "Invalid vaccination ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.vaccineName !== undefined) {
      const vaccineName = String(body.vaccineName).trim();
      if (!vaccineName) {
        return NextResponse.json({ error: "Vaccine name is required." }, { status: 400 });
      }
      updateData.vaccineName = vaccineName;
    }
    if (body.dateAdministered !== undefined) {
      const dateAdministered = String(body.dateAdministered).trim();
      if (!dateAdministered) {
        return NextResponse.json({ error: "Date administered is required." }, { status: 400 });
      }
      updateData.dateAdministered = dateAdministered;
    }
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate?.trim() || null;
    if (body.batchNumber !== undefined) updateData.batchNumber = body.batchNumber?.trim() || null;
    if (body.administeredBy !== undefined) updateData.administeredBy = body.administeredBy?.trim() || null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No vaccination updates provided." }, { status: 400 });
    }

    const [updated] = await db
      .update(vaccinations)
      .set(updateData)
      .where(eq(vaccinations.id, vaccinationId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Vaccination not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error updating vaccination:", error);
    const message = error instanceof Error ? error.message : "Failed to update vaccination";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    await db.delete(vaccinations).where(eq(vaccinations.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete vaccination" }, { status: 500 });
  }
}

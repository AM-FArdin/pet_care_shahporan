import { db, isDbConfigured } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.species !== undefined) updateData.species = body.species.trim();
    if (body.breed !== undefined) updateData.breed = body.breed?.trim() || null;
    if (body.color !== undefined) updateData.color = body.color?.trim() || null;
    if (body.sex !== undefined) updateData.sex = body.sex || null;
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth?.trim() || null;
    if (body.weight !== undefined) {
      updateData.weight =
        body.weight !== null && String(body.weight).trim() !== ""
          ? String(body.weight).trim()
          : null;
    }
    if (body.microchipId !== undefined) updateData.microchipId = body.microchipId?.trim() || null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const [updated] = await db
      .update(pets)
      .set(updateData)
      .where(eq(pets.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error updating pet:", error);
    const message = error instanceof Error ? error.message : "Failed to update pet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    await db.update(pets).set({ isActive: false, updatedAt: new Date() }).where(eq(pets.id, parseInt(id)));
    return NextResponse.json({ success: true, message: "Pet soft-deleted" });
  } catch (error: unknown) {
    console.error("Error deleting pet:", error);
    const message = error instanceof Error ? error.message : "Failed to delete pet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

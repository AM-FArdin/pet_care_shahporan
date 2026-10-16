import { db, isDbConfigured } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
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
    if (body.category !== undefined) updateData.category = body.category.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.quantity !== undefined) {
      updateData.quantity =
        body.quantity !== null && String(body.quantity).trim() !== ""
          ? parseInt(body.quantity)
          : 0;
    }
    if (body.unit !== undefined) updateData.unit = body.unit?.trim() || "units";
    if (body.minimumStock !== undefined) {
      updateData.minimumStock =
        body.minimumStock !== null && String(body.minimumStock).trim() !== ""
          ? parseInt(body.minimumStock)
          : 5;
    }
    if (body.costPrice !== undefined) {
      updateData.costPrice =
        body.costPrice !== null && String(body.costPrice).trim() !== ""
          ? String(body.costPrice).trim()
          : null;
    }
    if (body.sellingPrice !== undefined) {
      updateData.sellingPrice =
        body.sellingPrice !== null && String(body.sellingPrice).trim() !== ""
          ? String(body.sellingPrice).trim()
          : null;
    }
    if (body.supplier !== undefined) updateData.supplier = body.supplier?.trim() || null;
    if (body.expiryDate !== undefined) updateData.expiryDate = body.expiryDate?.trim() || null;
    if (body.batchNumber !== undefined) updateData.batchNumber = body.batchNumber?.trim() || null;
    if (body.location !== undefined) updateData.location = body.location?.trim() || null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const [updated] = await db
      .update(inventory)
      .set(updateData)
      .where(eq(inventory.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error updating inventory:", error);
    const message = error instanceof Error ? error.message : "Failed to update inventory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    await db.update(inventory).set({ isActive: false, updatedAt: new Date() }).where(eq(inventory.id, parseInt(id)));
    return NextResponse.json({ success: true, message: "Inventory item soft-deleted" });
  } catch (error: unknown) {
    console.error("Error deleting inventory item:", error);
    const message = error instanceof Error ? error.message : "Failed to delete inventory item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

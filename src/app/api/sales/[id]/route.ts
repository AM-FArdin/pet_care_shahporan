import { db, isDbConfigured, pool } from "@/lib/db";
import { sales, saleItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    const [sale] = await db.select().from(sales).where(eq(sales.id, parseInt(id)));
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, parseInt(id)));
    return NextResponse.json({ sale, items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch sale details" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db || !pool) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    const saleId = parseInt(id);

    // Get line items first to restore inventory
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    for (const item of items) {
      if (item.inventoryId) {
        try {
          await pool.query(
            "UPDATE inventory SET quantity = quantity + ? WHERE id = ?",
            [item.quantity, item.inventoryId]
          );
        } catch (invErr) {
          console.warn("Failed to restore inventory on sale cancellation:", invErr);
        }
      }
    }

    await db.delete(sales).where(eq(sales.id, saleId));
    return NextResponse.json({ success: true, message: "Sale deleted and inventory restored" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 });
  }
}

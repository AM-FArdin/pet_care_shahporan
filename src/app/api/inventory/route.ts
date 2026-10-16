import { db, isDbConfigured } from "@/lib/db";
import { ensureTablesExist } from "@/lib/db/init";
import { inventory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured || !db) {
    return NextResponse.json(
      { error: "Database not configured. Please set DATABASE_URL.", notConfigured: true },
      { status: 503 }
    );
  }

  try {
    const fetchItems = () =>
      db
        .select()
        .from(inventory)
        .where(eq(inventory.isActive, true))
        .orderBy(inventory.category, inventory.name);

    try {
      const items = await fetchItems();
      return NextResponse.json(items);
    } catch {
      await ensureTablesExist();
      const items = await fetchItems();
      return NextResponse.json(items);
    }
  } catch (error: unknown) {
    console.error("Error in GET /api/inventory:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch inventory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json(
      { error: "Database not configured.", notConfigured: true },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    if (!body.name?.trim() || !body.category?.trim()) {
      return NextResponse.json(
        { error: "Product name and category are required." },
        { status: 400 }
      );
    }

    const payload = {
      name: body.name.trim(),
      category: body.category.trim(),
      description: body.description?.trim() || null,
      quantity:
        body.quantity !== undefined && body.quantity !== null && String(body.quantity).trim() !== ""
          ? parseInt(body.quantity)
          : 0,
      unit: body.unit?.trim() || "units",
      minimumStock:
        body.minimumStock !== undefined && body.minimumStock !== null && String(body.minimumStock).trim() !== ""
          ? parseInt(body.minimumStock)
          : 5,
      costPrice:
        body.costPrice !== undefined && body.costPrice !== null && String(body.costPrice).trim() !== ""
          ? String(body.costPrice).trim()
          : null,
      sellingPrice:
        body.sellingPrice !== undefined && body.sellingPrice !== null && String(body.sellingPrice).trim() !== ""
          ? String(body.sellingPrice).trim()
          : null,
      supplier: body.supplier?.trim() || null,
      expiryDate: body.expiryDate?.trim() || null,
      batchNumber: body.batchNumber?.trim() || null,
      location: body.location?.trim() || null,
      isActive: true,
    };

    try {
      const [item] = await db.insert(inventory).values(payload).returning();
      return NextResponse.json(item, { status: 201 });
    } catch {
      await ensureTablesExist();
      const [item] = await db.insert(inventory).values(payload).returning();
      return NextResponse.json(item, { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error in POST /api/inventory:", error);
    const message = error instanceof Error ? error.message : "Failed to add inventory item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

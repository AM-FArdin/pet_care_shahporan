import { db, isDbConfigured } from "@/lib/db";
import { sales, saleItems, inventory } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
    const { id } = await params;
    const saleId = parseInt(id);
    if (!Number.isInteger(saleId)) return NextResponse.json({ error: "Invalid sale id" }, { status: 400 });

    try {
      const body = await req.json();
      const {
        customerName, customerPhone, ownerId, petId, petName, items,
        discountType = "none", discountValue = 0, paidAmount = 0,
        paymentMethod = "Cash", paymentReference, doctorOrStaff, notes,
      } = body;
      if (!customerName?.trim() || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "Customer name and at least one item are required." }, { status: 400 });
      }
      const normalizedItems = items.map((item) => ({
        itemType: item.itemType === "product" ? "product" : "service",
        inventoryId: item.inventoryId ? parseInt(item.inventoryId) : null,
        name: String(item.name || "").trim(),
        unitPrice: Number(item.unitPrice),
        quantity: Number(item.quantity),
        discountPercentage: Math.min(100, Math.max(0, Number(item.discountPercentage) || 0)),
      }));
      if (normalizedItems.some((item) => !item.name || !Number.isFinite(item.unitPrice) || item.unitPrice < 0 || !Number.isInteger(item.quantity) || item.quantity < 1)) {
        return NextResponse.json({ error: "Each item needs a valid name, price, and quantity." }, { status: 400 });
      }
      const subtotal = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const itemDiscountAmount = normalizedItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity * item.discountPercentage / 100,
        0
      );
      const afterItemDiscounts = Math.max(0, subtotal - itemDiscountAmount);
      const numericDiscount = Math.max(0, Number(discountValue) || 0);
      const rawDiscount = discountType === "percentage" ? afterItemDiscounts * numericDiscount / 100 : discountType === "fixed" ? numericDiscount : 0;
      const overallDiscountAmount = Math.min(rawDiscount, afterItemDiscounts);
      const discountAmount = itemDiscountAmount + overallDiscountAmount;
      const totalAmount = Math.max(0, afterItemDiscounts - overallDiscountAmount);
      const numPaid = Math.max(0, Number(paidAmount) || 0);
      const changeAmount = Math.max(0, numPaid - totalAmount);
      const [existing] = await db.select().from(sales).where(eq(sales.id, saleId));
      if (!existing) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
      const oldItems = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));

      await db.transaction(async (tx) => {
        for (const item of oldItems) {
          if (item.inventoryId) await tx.update(inventory).set({ quantity: sql`${inventory.quantity} + ${item.quantity}` }).where(eq(inventory.id, item.inventoryId));
        }
        for (const item of normalizedItems) {
          if (item.inventoryId) await tx.update(inventory).set({ quantity: sql`GREATEST(0, ${inventory.quantity} - ${item.quantity})` }).where(eq(inventory.id, item.inventoryId));
        }
        await tx.update(sales).set({
          ownerId: ownerId ? parseInt(ownerId) : null,
          customerName: customerName.trim(),
          customerPhone: customerPhone || null,
          petId: petId ? parseInt(petId) : null,
          petName: petName || null,
          subtotal: subtotal.toFixed(2),
          discountType,
          discountValue: numericDiscount.toFixed(2),
          overallDiscountAmount: overallDiscountAmount.toFixed(2),
          itemDiscountAmount: itemDiscountAmount.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          paidAmount: numPaid.toFixed(2),
          changeAmount: changeAmount.toFixed(2),
          paymentMethod,
          paymentReference: paymentReference?.trim() || null,
          paymentStatus: numPaid >= totalAmount ? "Paid" : "Due",
          doctorOrStaff: doctorOrStaff || null,
          notes: notes || null,
          updatedAt: new Date(),
        }).where(eq(sales.id, saleId));
        await tx.delete(saleItems).where(eq(saleItems.saleId, saleId));
        await tx.insert(saleItems).values(normalizedItems.map((item) => ({
          saleId, itemType: item.itemType, inventoryId: item.inventoryId, name: item.name,
          unitPrice: item.unitPrice.toFixed(2), quantity: item.quantity,
          discountPercentage: item.discountPercentage.toFixed(2),
          discountAmount: (item.unitPrice * item.quantity * item.discountPercentage / 100).toFixed(2),
          totalPrice: (item.unitPrice * item.quantity * (1 - item.discountPercentage / 100)).toFixed(2),
        })));
      });
      const [updated] = await db.select().from(sales).where(eq(sales.id, saleId));
      const updatedItems = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
      return NextResponse.json({ sale: updated, items: updatedItems });
    } catch (error) {
      console.error("Error in PUT /api/sales/[id]:", error);
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
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
          const qty = item.quantity;
          const invId = item.inventoryId;
          await db
            .update(inventory)
            .set({ quantity: sql`${inventory.quantity} + ${qty}` })
            .where(eq(inventory.id, invId));
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

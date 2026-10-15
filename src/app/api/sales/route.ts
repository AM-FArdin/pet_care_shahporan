import { db, isDbConfigured, pool } from "@/lib/db";
import { ensureTablesExist } from "@/lib/db/init";
import { sales, saleItems, inventory } from "@/lib/db/schema";
import { desc, eq, like, or, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json(
      { error: "Database not configured.", notConfigured: true },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  try {
    const fetchSales = async () => {
      let queryBuilder = db.select().from(sales);
      if (q) {
        queryBuilder = db
          .select()
          .from(sales)
          .where(
            or(
              like(sales.invoiceNumber, `%${q}%`),
              like(sales.customerName, `%${q}%`),
              like(sales.customerPhone, `%${q}%`),
              like(sales.petName, `%${q}%`)
            )
          ) as typeof queryBuilder;
      }
      return await queryBuilder.orderBy(desc(sales.createdAt));
    };

    let allSales;
    try {
      allSales = await fetchSales();
    } catch {
      await ensureTablesExist();
      allSales = await fetchSales();
    }

    // Calculate revenue metrics
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let totalRevenue = 0;
    let totalDiscounts = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;

    for (const s of allSales) {
      const amount = Number(s.totalAmount) || 0;
      const discount = Number(s.discountAmount) || 0;
      const saleTime = new Date(s.createdAt).getTime();

      totalRevenue += amount;
      totalDiscounts += discount;

      if (saleTime >= startOfToday) {
        todayRevenue += amount;
      }
      if (saleTime >= startOfMonth) {
        monthRevenue += amount;
      }
    }

    return NextResponse.json({
      sales: allSales,
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalSalesCount: allSales.length,
        totalDiscounts: totalDiscounts.toFixed(2),
        todayRevenue: todayRevenue.toFixed(2),
        monthRevenue: monthRevenue.toFixed(2),
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/sales:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch sales";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db || !pool) {
    return NextResponse.json(
      { error: "Database not configured.", notConfigured: true },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      ownerId,
      petId,
      petName,
      items, // array of { itemType, inventoryId, name, unitPrice, quantity, totalPrice }
      discountType = "none",
      discountValue = 0,
      paidAmount = 0,
      paymentMethod = "Cash",
      paymentStatus = "Paid",
      doctorOrStaff,
      notes,
    } = body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Customer name and at least one item are required." },
        { status: 400 }
      );
    }

    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of items) {
      const itemTotal = Number(item.unitPrice) * Number(item.quantity);
      subtotal += itemTotal;
    }

    // Calculate discount
    let discountAmount = 0;
    const numDiscountValue = Number(discountValue) || 0;
    if (discountType === "percentage") {
      discountAmount = (subtotal * numDiscountValue) / 100;
    } else if (discountType === "fixed") {
      discountAmount = numDiscountValue;
    }
    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);
    const totalAmount = Math.max(0, subtotal - discountAmount);

    const numPaid = Number(paidAmount) || totalAmount;
    const changeAmount = Math.max(0, numPaid - totalAmount);

    // Generate unique invoice number: INV-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    try {
      await ensureTablesExist();
    } catch (e) {
      console.warn("ensureTablesExist warning:", e);
    }

    // Insert sale
    const [res] = await db.insert(sales).values({
      invoiceNumber,
      ownerId: ownerId ? parseInt(ownerId) : null,
      customerName,
      customerPhone: customerPhone || null,
      petId: petId ? parseInt(petId) : null,
      petName: petName || null,
      subtotal: subtotal.toFixed(2),
      discountType,
      discountValue: numDiscountValue.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      paidAmount: numPaid.toFixed(2),
      changeAmount: changeAmount.toFixed(2),
      paymentMethod,
      paymentStatus,
      doctorOrStaff: doctorOrStaff || null,
      notes: notes || null,
    });

    const saleId = (res as { insertId: number }).insertId;

    // Insert line items and auto-update inventory stock
    for (const item of items) {
      const itemTotal = Number(item.unitPrice) * Number(item.quantity);
      await db.insert(saleItems).values({
        saleId,
        itemType: item.itemType || "product",
        inventoryId: item.inventoryId ? parseInt(item.inventoryId) : null,
        name: item.name,
        unitPrice: Number(item.unitPrice).toFixed(2),
        quantity: parseInt(item.quantity) || 1,
        totalPrice: itemTotal.toFixed(2),
      });

      // Deduct inventory if item is from inventory
      if (item.inventoryId) {
        try {
          await pool.query(
            "UPDATE inventory SET quantity = GREATEST(0, quantity - ?) WHERE id = ?",
            [parseInt(item.quantity) || 1, parseInt(item.inventoryId)]
          );
        } catch (invErr) {
          console.warn("Failed to auto-deduct inventory:", invErr);
        }
      }
    }

    const [createdSale] = await db.select().from(sales).where(eq(sales.id, saleId));
    const createdItems = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));

    return NextResponse.json(
      { sale: createdSale, items: createdItems },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error in POST /api/sales:", error);
    const message = error instanceof Error ? error.message : "Failed to record sale";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

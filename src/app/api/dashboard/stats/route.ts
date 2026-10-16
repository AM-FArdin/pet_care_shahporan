import { db, isDbConfigured } from "@/lib/db";
import { owners, pets, inventory, sales, expenses } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured || !db) {
    return NextResponse.json({
      totalPatients: 0,
      totalOwners: 0,
      lowStockCount: 0,
      todayRevenue: "0.00",
      totalExpenses: "0.00",
      netRevenue: "0.00",
      notConfigured: true,
    });
  }

  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const [ownerCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(owners);
    const [petCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(pets)
      .where(eq(pets.isActive, true));

    const allInventory = await db.select().from(inventory).where(eq(inventory.isActive, true));
    const lowStockCount = allInventory.filter(
      (i) => i.minimumStock !== null && i.quantity <= (i.minimumStock ?? 0)
    ).length;

    const todaySales = await db
      .select()
      .from(sales)
      .where(sql`DATE(created_at) = ${todayStr}`);
    const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

    const allSales = await db.select().from(sales);
    const totalSalesAmount = allSales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
    const totalDiscounts = allSales.reduce((sum, s) => sum + Number(s.discountAmount || 0), 0);

    const allExpenses = await db.select().from(expenses).where(eq(expenses.isDeleted, false));
    const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const netRevenue = totalSalesAmount - totalDiscounts - totalExpenses;

    return NextResponse.json({
      totalPatients: Number(petCount.count),
      totalOwners: Number(ownerCount.count),
      lowStockCount,
      todayRevenue: todayRevenue.toFixed(2),
      totalSalesAmount: totalSalesAmount.toFixed(2),
      totalDiscounts: totalDiscounts.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netRevenue: netRevenue.toFixed(2),
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/dashboard/stats:", error);
    return NextResponse.json({
      totalPatients: 0,
      totalOwners: 0,
      lowStockCount: 0,
      todayRevenue: "0.00",
      totalExpenses: "0.00",
      netRevenue: "0.00",
      error: error instanceof Error ? error.message : "Failed to load stats",
    });
  }
}

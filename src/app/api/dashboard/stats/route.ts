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

    const [
      [ownerCount],
      [petCount],
      [inventoryCount],
      [todaySales],
      [salesTotals],
      [expenseTotals],
    ] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(owners),
      db.select({ count: sql<number>`COUNT(*)` }).from(pets).where(eq(pets.isActive, true)),
      db.select({ count: sql<number>`COUNT(*)` }).from(inventory).where(
        sql`${inventory.isActive} = true AND ${inventory.quantity} <= COALESCE(${inventory.minimumStock}, 0)`
      ),
      db.select({ revenue: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)` }).from(sales)
        .where(sql`DATE(${sales.createdAt}) = ${todayStr}`),
      db.select({
        amount: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
        discounts: sql<string>`COALESCE(SUM(${sales.discountAmount}), 0)`,
      }).from(sales),
      db.select({ amount: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` }).from(expenses)
        .where(eq(expenses.isDeleted, false)),
    ]);

    const lowStockCount = Number(inventoryCount.count);
    const todayRevenue = Number(todaySales.revenue);
    const totalSalesAmount = Number(salesTotals.amount);
    const totalDiscounts = Number(salesTotals.discounts);
    const totalExpenses = Number(expenseTotals.amount);
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

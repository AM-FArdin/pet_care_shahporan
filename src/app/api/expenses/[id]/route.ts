import { db, isDbConfigured } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
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
    const expenseId = parseInt(id);
    if (!Number.isInteger(expenseId)) {
      return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
    }
    const { date, category, description, amount, paidTo, notes } = body;
    if (!date || !category || amount === undefined || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
      return NextResponse.json({ error: "Date, category, and a non-negative amount are required." }, { status: 400 });
    }
    await db.update(expenses).set({
      date,
      category,
      description: description || null,
      amount: Number(amount).toFixed(2),
      paidTo: paidTo || null,
      notes: notes || null,
      updatedAt: new Date(),
    }).where(eq(expenses.id, expenseId));
    const [updated] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
    if (!updated) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    await db.update(expenses).set({ isDeleted: true, updatedAt: new Date() }).where(eq(expenses.id, parseInt(id)));
    return NextResponse.json({ success: true, message: "Expense soft-deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}

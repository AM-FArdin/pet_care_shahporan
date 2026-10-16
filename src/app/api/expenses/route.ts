import { db, isDbConfigured } from "@/lib/db";
import { ensureTablesExist } from "@/lib/db/init";
import { expenses } from "@/lib/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json(
      { error: "Database not configured.", notConfigured: true },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const fetchExpenses = () => {
      if (from && to) {
        return db
          .select()
          .from(expenses)
          .where(
            and(
              eq(expenses.isDeleted, false),
              gte(expenses.date, from),
              lte(expenses.date, to)
            )
          )
          .orderBy(desc(expenses.date));
      }
      return db
        .select()
        .from(expenses)
        .where(eq(expenses.isDeleted, false))
        .orderBy(desc(expenses.date));
    };

    try {
      const result = await fetchExpenses();
      return NextResponse.json(result);
    } catch {
      await ensureTablesExist();
      const result = await fetchExpenses();
      return NextResponse.json(result);
    }
  } catch (error: unknown) {
    console.error("Error in GET /api/expenses:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch expenses";
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
    const { date, category, description, amount, paidTo, notes } = body;

    if (!date || !category || !amount) {
      return NextResponse.json(
        { error: "Date, category, and amount are required." },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(expenses)
      .values({
        date,
        category,
        description: description || null,
        amount: Number(amount).toFixed(2),
        paidTo: paidTo || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error("Error in POST /api/expenses:", error);
    const message = error instanceof Error ? error.message : "Failed to create expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

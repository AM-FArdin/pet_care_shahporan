import { db, isDbConfigured } from "@/lib/db";
import { reminderCompletions } from "@/lib/db/schema";
import { ensureTablesExist } from "@/lib/db/init";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await req.json();
    const sourceType = body.sourceType?.trim();
    const sourceId = Number(body.sourceId);
    if (!["vaccination", "medical_record"].includes(sourceType) || !Number.isInteger(sourceId) || sourceId <= 0) {
      return NextResponse.json({ error: "Invalid reminder." }, { status: 400 });
    }

    let completion;
    try {
      [completion] = await db
        .insert(reminderCompletions)
        .values({
          sourceType,
          sourceId,
          notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
        })
        .onConflictDoUpdate({
          target: [reminderCompletions.sourceType, reminderCompletions.sourceId],
          set: {
            completedAt: new Date(),
            notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
          },
        })
        .returning();
    } catch {
      await ensureTablesExist();
      [completion] = await db
        .insert(reminderCompletions)
        .values({
          sourceType,
          sourceId,
          notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
        })
        .onConflictDoUpdate({
          target: [reminderCompletions.sourceType, reminderCompletions.sourceId],
          set: {
            completedAt: new Date(),
            notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
          },
        })
        .returning();
    }

    return NextResponse.json({ success: true, completion });
  } catch (error) {
    console.error("Error completing reminder:", error);
    return NextResponse.json({ error: "Failed to mark reminder done." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await req.json();
    const sourceType = body.sourceType?.trim();
    const sourceId = Number(body.sourceId);
    if (!["vaccination", "medical_record"].includes(sourceType) || !Number.isInteger(sourceId) || sourceId <= 0) {
      return NextResponse.json({ error: "Invalid reminder." }, { status: 400 });
    }

    await db
      .delete(reminderCompletions)
      .where(and(
        eq(reminderCompletions.sourceType, sourceType),
        eq(reminderCompletions.sourceId, sourceId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reopening reminder:", error);
    return NextResponse.json({ error: "Failed to reopen reminder." }, { status: 500 });
  }
}

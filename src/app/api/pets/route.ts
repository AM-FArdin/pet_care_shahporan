import { db, isDbConfigured } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const [res] = await db.insert(pets).values(body);
    const [pet] = await db.select().from(pets).where(eq(pets.id, (res as { insertId: number }).insertId));
    return NextResponse.json(pet || { id: (res as { insertId: number }).insertId, ...body }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create pet" }, { status: 500 });
  }
}

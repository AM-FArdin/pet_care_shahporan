import { db } from "@/lib/db";
import { owners } from "@/lib/db/schema";
import { ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  try {
    const result = q
      ? await db
          .select()
          .from(owners)
          .where(or(ilike(owners.name, `%${q}%`), ilike(owners.phone, `%${q}%`)))
          .orderBy(owners.name)
      : await db.select().from(owners).orderBy(owners.name);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch owners" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [owner] = await db.insert(owners).values(body).returning();
    return NextResponse.json(owner, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create owner" }, { status: 500 });
  }
}

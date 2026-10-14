import { db } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const items = await db.select().from(inventory).orderBy(inventory.category, inventory.name);
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [item] = await db.insert(inventory).values(body).returning();
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add inventory item" }, { status: 500 });
  }
}

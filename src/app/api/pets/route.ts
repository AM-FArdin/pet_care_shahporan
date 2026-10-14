import { db } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [pet] = await db.insert(pets).values(body).returning();
    return NextResponse.json(pet, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create pet" }, { status: 500 });
  }
}

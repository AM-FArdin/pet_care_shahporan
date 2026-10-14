import { db } from "@/lib/db";
import { vaccinations } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [vax] = await db.insert(vaccinations).values(body).returning();
    return NextResponse.json(vax, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add vaccination" }, { status: 500 });
  }
}

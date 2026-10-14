import { db } from "@/lib/db";
import { medicalRecords } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [record] = await db.insert(medicalRecords).values(body).returning();
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add medical record" }, { status: 500 });
  }
}

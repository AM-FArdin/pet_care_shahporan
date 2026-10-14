import { db, isDbConfigured } from "@/lib/db";
import { medicalRecords } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const [res] = await db.insert(medicalRecords).values(body);
    return NextResponse.json({ id: (res as { insertId: number }).insertId, ...body }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add medical record" }, { status: 500 });
  }
}

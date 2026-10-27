import { db, isDbConfigured } from "@/lib/db";
import { clinicServices } from "@/lib/db/schema";
import { ensureTablesExist } from "@/lib/db/init";
import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const fetchServices = () => db.select().from(clinicServices).where(eq(clinicServices.isActive, true)).orderBy(asc(clinicServices.name));
    try {
      return NextResponse.json(await fetchServices());
    } catch {
      await ensureTablesExist();
      return NextResponse.json(await fetchServices());
    }
  } catch (error) {
    console.error("Error fetching clinic services:", error);
    return NextResponse.json({ error: "Failed to fetch clinic services" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const body = await req.json();
    const name = body.name?.trim();
    const fee = Number(body.fee);
    if (!name || !Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: "Service name and a valid fee are required." }, { status: 400 });
    let service;
    try {
      [service] = await db.insert(clinicServices).values({ name, fee: fee.toFixed(2) }).returning();
    } catch {
      await ensureTablesExist();
      [service] = await db.insert(clinicServices).values({ name, fee: fee.toFixed(2) }).returning();
    }
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating clinic service:", error);
    return NextResponse.json({ error: "Failed to create clinic service" }, { status: 500 });
  }
}

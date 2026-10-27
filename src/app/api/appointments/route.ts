import { db, isDbConfigured } from "@/lib/db";
import { appointments, owners, pets } from "@/lib/db/schema";
import { ensureTablesExist } from "@/lib/db/init";
import { desc, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const includeCompleted = new URL(req.url).searchParams.get("includeCompleted") === "true";
    const rows = await db.select({
      id: appointments.id, ownerId: appointments.ownerId, petId: appointments.petId,
      scheduledAt: appointments.scheduledAt, reason: appointments.reason, status: appointments.status, notes: appointments.notes,
      ownerName: owners.name, petName: pets.name,
    }).from(appointments)
      .innerJoin(owners, eq(appointments.ownerId, owners.id))
      .innerJoin(pets, eq(appointments.petId, pets.id))
      .where(includeCompleted ? undefined : ne(appointments.status, "completed"))
      .orderBy(desc(appointments.scheduledAt));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const body = await req.json();
    const ownerId = Number(body.ownerId), petId = Number(body.petId);
    if (!Number.isInteger(ownerId) || !Number.isInteger(petId) || !body.scheduledAt) {
      return NextResponse.json({ error: "Customer, pet, and appointment time are required." }, { status: 400 });
    }
    const createAppointment = () => db.insert(appointments).values({
      ownerId, petId, scheduledAt: new Date(body.scheduledAt),
      reason: body.reason?.trim() || null, status: body.status || "scheduled", notes: body.notes?.trim() || null,
    }).returning();
    let appointment;
    try {
      [appointment] = await createAppointment();
    } catch {
      await ensureTablesExist();
      [appointment] = await createAppointment();
    }
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}

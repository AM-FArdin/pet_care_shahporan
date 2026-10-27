import { db, isDbConfigured } from "@/lib/db";
import { prescriptions, pets, owners } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const rows = await db.select({
      id: prescriptions.id, petId: prescriptions.petId, petName: pets.name, ownerName: owners.name,
      medicineName: prescriptions.medicineName, concentration: prescriptions.concentration,
      weightKg: prescriptions.weightKg, doseMgPerKg: prescriptions.doseMgPerKg,
      calculatedDoseMg: prescriptions.calculatedDoseMg, frequency: prescriptions.frequency,
      duration: prescriptions.duration, instructions: prescriptions.instructions,
      sourceName: prescriptions.sourceName, sourceReference: prescriptions.sourceReference,
      clinicianVerified: prescriptions.clinicianVerified, createdAt: prescriptions.createdAt,
    }).from(prescriptions).innerJoin(pets, eq(prescriptions.petId, pets.id))
      .innerJoin(owners, eq(pets.ownerId, owners.id)).orderBy(desc(prescriptions.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const body = await req.json();
    const petId = Number(body.petId), weightKg = Number(body.weightKg), doseMgPerKg = Number(body.doseMgPerKg);
    if (!Number.isInteger(petId) || weightKg <= 0 || doseMgPerKg <= 0 || !body.medicineName?.trim() || !body.frequency?.trim() || !body.sourceName?.trim()) {
      return NextResponse.json({ error: "Pet, medicine, weight, dose, frequency, and a verified source are required." }, { status: 400 });
    }
    const [prescription] = await db.insert(prescriptions).values({
      petId, medicineName: body.medicineName.trim(), concentration: body.concentration?.trim() || null,
      weightKg: weightKg.toFixed(2), doseMgPerKg: doseMgPerKg.toFixed(3),
      calculatedDoseMg: (weightKg * doseMgPerKg).toFixed(3), frequency: body.frequency.trim(),
      duration: body.duration?.trim() || null, instructions: body.instructions?.trim() || null,
      sourceName: body.sourceName.trim(), sourceReference: body.sourceReference?.trim() || null,
      clinicianVerified: body.clinicianVerified === true,
    }).returning();
    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json({ error: "Failed to save prescription" }, { status: 500 });
  }
}

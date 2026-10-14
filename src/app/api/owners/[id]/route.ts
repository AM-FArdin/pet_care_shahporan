import { db, isDbConfigured } from "@/lib/db";
import { owners, pets, vaccinations, medicalRecords } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    const [owner] = await db.select().from(owners).where(eq(owners.id, parseInt(id)));
    if (!owner) return NextResponse.json({ error: "Owner not found" }, { status: 404 });

    const ownerPets = await db.select().from(pets).where(eq(pets.ownerId, parseInt(id))).orderBy(pets.name);

    const petsWithData = await Promise.all(
      ownerPets.map(async (pet) => {
        const vax = await db.select().from(vaccinations).where(eq(vaccinations.petId, pet.id)).orderBy(vaccinations.dateAdministered);
        const records = await db.select().from(medicalRecords).where(eq(medicalRecords.petId, pet.id)).orderBy(medicalRecords.visitDate);
        return { ...pet, vaccinations: vax, medicalRecords: records };
      })
    );

    return NextResponse.json({ ...owner, pets: petsWithData });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch owner" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const [updated] = await db.update(owners).set({ ...body, updatedAt: new Date() }).where(eq(owners.id, parseInt(id))).returning();
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update owner" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    await db.delete(owners).where(eq(owners.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete owner" }, { status: 500 });
  }
}

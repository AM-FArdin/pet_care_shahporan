import { db, isDbConfigured } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const ownerId = Number(body.ownerId);

    if (!body.name?.trim() || !body.species?.trim() || isNaN(ownerId)) {
      return NextResponse.json(
        { error: "Pet name, species, and a valid owner ID are required." },
        { status: 400 }
      );
    }

    const [pet] = await db
      .insert(pets)
      .values({
        ownerId,
        name: body.name.trim(),
        species: body.species.trim(),
        breed: body.breed?.trim() || null,
        color: body.color?.trim() || null,
        sex: body.sex || "Male",
        dateOfBirth: body.dateOfBirth?.trim() || null,
        weight:
          body.weight !== undefined && body.weight !== null && String(body.weight).trim() !== ""
            ? String(body.weight).trim()
            : null,
        microchipId: body.microchipId?.trim() || null,
        notes: body.notes?.trim() || null,
        isActive: true,
      })
      .returning();

    return NextResponse.json(pet, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating pet:", error);
    const message = error instanceof Error ? error.message : "Failed to create pet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

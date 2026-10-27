import { db, isDbConfigured } from "@/lib/db";
import { owners, pets } from "@/lib/db/schema";
import { ensureTablesExist } from "@/lib/db/init";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const body = await req.json();
    const ownerName = body.ownerName?.trim(), phone = body.phone?.trim(), petName = body.petName?.trim(), species = body.species?.trim();
    if (!ownerName || !phone || !petName || !species) return NextResponse.json({ error: "Customer name, phone, pet name, and species are required." }, { status: 400 });
    const createProfile = async () => {
      const [owner] = await db.insert(owners).values({ name: ownerName, phone, email: body.email?.trim() || null, address: body.address?.trim() || null }).returning();
      try {
        const [pet] = await db.insert(pets).values({ ownerId: owner.id, name: petName, species, breed: body.breed?.trim() || null, weight: body.weightKg ? String(body.weightKg) : null }).returning();
        return { owner, pet };
      } catch (error) {
        await db.delete(owners).where(eq(owners.id, owner.id));
        throw error;
      }
    };
    let result;
    try {
      result = await createProfile();
    } catch {
      await ensureTablesExist();
      result = await createProfile();
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error registering customer and pet:", error);
    return NextResponse.json({ error: "Failed to create customer and pet profile" }, { status: 500 });
  }
}

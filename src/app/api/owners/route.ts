import { db, isDbConfigured } from "@/lib/db";
import { ensureTablesExist } from "@/lib/db/init";
import { owners, pets } from "@/lib/db/schema";
import { eq, like, or, inArray, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json(
      { error: "Database not configured. Please set DATABASE_URL.", notConfigured: true },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  try {
    const fetchList = async () => {
      let matchedOwnerIdsFromPets: number[] = [];
      if (q) {
        const petMatches = await db
          .select({ ownerId: pets.ownerId })
          .from(pets)
          .where(and(eq(pets.isActive, true), like(pets.name, `%${q}%`)));
        matchedOwnerIdsFromPets = Array.from(new Set(petMatches.map((p) => p.ownerId)));
      }

      let ownerResults;
      if (q) {
        const filters = [
          like(owners.name, `%${q}%`),
          like(owners.phone, `%${q}%`),
        ];
        if (matchedOwnerIdsFromPets.length > 0) {
          filters.push(inArray(owners.id, matchedOwnerIdsFromPets));
        }
        ownerResults = await db
          .select()
          .from(owners)
          .where(or(...filters))
          .orderBy(owners.name);
      } else {
        ownerResults = await db.select().from(owners).orderBy(owners.name);
      }

      const ownerIds = ownerResults.map((o) => o.id);
      const petResults =
        ownerIds.length > 0
          ? await db
              .select()
              .from(pets)
              .where(and(inArray(pets.ownerId, ownerIds), eq(pets.isActive, true)))
          : [];

      const petsByOwner = new Map<number, typeof petResults>();
      for (const p of petResults) {
        const list = petsByOwner.get(p.ownerId) || [];
        list.push(p);
        petsByOwner.set(p.ownerId, list);
      }

      return ownerResults.map((o) => ({
        ...o,
        pets: petsByOwner.get(o.id) || [],
      }));
    };

    try {
      const result = await fetchList();
      return NextResponse.json(result);
    } catch {
      await ensureTablesExist();
      const result = await fetchList();
      return NextResponse.json(result);
    }
  } catch (error: unknown) {
    console.error("Error in GET /api/owners:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch owners";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json(
      { error: "Database not configured.", notConfigured: true },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    try {
      const [newOwner] = await db.insert(owners).values(body).returning();
      return NextResponse.json(newOwner, { status: 201 });
    } catch {
      await ensureTablesExist();
      const [newOwner] = await db.insert(owners).values(body).returning();
      return NextResponse.json(newOwner, { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error in POST /api/owners:", error);
    const message = error instanceof Error ? error.message : "Failed to create owner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

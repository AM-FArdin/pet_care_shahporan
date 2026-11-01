import { db, isDbConfigured } from "@/lib/db";
import { ensureTablesExist } from "@/lib/db/init";
import { inventory, prescriptionMedicines } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const fetchMedicines = () => db.select().from(prescriptionMedicines)
      .where(eq(prescriptionMedicines.isActive, true)).orderBy(asc(prescriptionMedicines.name));
    try {
      return NextResponse.json(await fetchMedicines());
    } catch {
      await ensureTablesExist();
      return NextResponse.json(await fetchMedicines());
    }
  } catch (error) {
    console.error("Error fetching prescription medicines:", error);
    return NextResponse.json({ error: "Failed to fetch prescription medicines" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const body = await req.json();
    const hasInventoryReference = body.inventoryId !== undefined
      && body.inventoryId !== null
      && String(body.inventoryId).trim() !== "";
    const inventoryId = hasInventoryReference ? Number(body.inventoryId) : null;
    if (hasInventoryReference && (inventoryId === null || !Number.isInteger(inventoryId) || inventoryId <= 0)) {
      return NextResponse.json({ error: "Inventory reference must be a valid item." }, { status: 400 });
    }
    let name = typeof body.name === "string" ? body.name.trim() : "";
    const medicineClass = typeof body.medicineClass === "string" ? body.medicineClass.trim() || null : null;
    let concentration = typeof body.concentration === "string" ? body.concentration.trim() || null : null;
    const doseUnit = body.doseUnit === "ml/kg" ? "ml/kg" : "mg/kg";
    const doseText = body.doseMgPerKg === undefined || body.doseMgPerKg === null ? "" : String(body.doseMgPerKg).trim();
    const doseMgPerKg = doseText ? Number(doseText) : null;
    if (doseText && !Number.isFinite(doseMgPerKg)) {
      return NextResponse.json({ error: "Dose rate must be a valid number." }, { status: 400 });
    }
    if (doseMgPerKg !== null && (!Number.isFinite(doseMgPerKg) || doseMgPerKg <= 0)) {
      return NextResponse.json({ error: "Dose rate must be a positive number." }, { status: 400 });
    }
    if (inventoryId) {
      const [item] = await db.select().from(inventory).where(eq(inventory.id, inventoryId));
      if (!item || !item.isActive || !["medicine", "vaccine"].includes(item.category.trim().toLowerCase())) {
        return NextResponse.json({ error: "Select an active medicine or vaccine from inventory." }, { status: 400 });
      }
      name = item.name;
      concentration = concentration || item.concentration;
    }
    if (!name) return NextResponse.json({ error: "Medicine name is required." }, { status: 400 });
    try {
      const [medicine] = await db.insert(prescriptionMedicines).values({ inventoryId, name, medicineClass, concentration: doseUnit === "ml/kg" ? null : concentration, doseMgPerKg: doseMgPerKg?.toFixed(3) || null, doseUnit }).returning();
      return NextResponse.json(medicine, { status: 201 });
    } catch {
      await ensureTablesExist();
      const [medicine] = await db.insert(prescriptionMedicines).values({ inventoryId, name, medicineClass, concentration: doseUnit === "ml/kg" ? null : concentration, doseMgPerKg: doseMgPerKg?.toFixed(3) || null, doseUnit }).returning();
      return NextResponse.json(medicine, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating prescription medicine:", error);
    return NextResponse.json({ error: "Failed to add prescription medicine" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "A valid medicine id is required." }, { status: 400 });
  try {
    await db.update(prescriptionMedicines).set({ isActive: false, updatedAt: new Date() })
      .where(eq(prescriptionMedicines.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing prescription medicine:", error);
    return NextResponse.json({ error: "Failed to remove prescription medicine" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
    if (!isDbConfigured || !db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id)) return NextResponse.json({ error: "A valid medicine id is required." }, { status: 400 });
    try {
      const body = await req.json();
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const medicineClass = typeof body.medicineClass === "string" ? body.medicineClass.trim() || null : null;
      if (!name) return NextResponse.json({ error: "Medicine name is required." }, { status: 400 });
      const doseText = body.doseMgPerKg === undefined || body.doseMgPerKg === null ? "" : String(body.doseMgPerKg).trim();
      const doseMgPerKg = doseText ? Number(doseText) : null;
      const doseUnit = body.doseUnit === "ml/kg" ? "ml/kg" : "mg/kg";
      if (doseText && !Number.isFinite(doseMgPerKg)) {
        return NextResponse.json({ error: "Dose rate must be a valid number." }, { status: 400 });
      }
      if (doseMgPerKg !== null && (!Number.isFinite(doseMgPerKg) || doseMgPerKg <= 0)) {
        return NextResponse.json({ error: "Dose rate must be a positive number." }, { status: 400 });
      }
      const [medicine] = await db.update(prescriptionMedicines)
        .set({ name, medicineClass, concentration: doseUnit === "ml/kg" ? null : typeof body.concentration === "string" ? body.concentration.trim() || null : null, doseMgPerKg: doseMgPerKg?.toFixed(3) || null, doseUnit, updatedAt: new Date() })
        .where(eq(prescriptionMedicines.id, id)).returning();
      return NextResponse.json(medicine);
    } catch (error) {
      console.error("Error updating prescription medicine:", error);
      return NextResponse.json({ error: "Failed to update prescription medicine" }, { status: 500 });
  }
}

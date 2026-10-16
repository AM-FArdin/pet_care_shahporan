import { db, isDbConfigured } from "@/lib/db";
import { pets, owners, vaccinations, medicalRecords } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface DueDateAlertItem {
  id: string;
  sourceType: "vaccination" | "medical_record";
  sourceId: number;
  title: string;
  dueDate: string;
  daysDiff: number;
  urgency: "overdue" | "due_today" | "due_soon" | "upcoming" | "later";
  petId: number;
  petName: string;
  species: string;
  breed: string | null;
  ownerId: number;
  ownerName: string;
  ownerPhone: string;
  doctorOrStaff: string | null;
  notes: string | null;
  whatsappUrl: string;
  telUrl: string;
  smsUrl: string;
}

function normalizeBangladeshPhone(phone: string): { international: string; local: string } {
  // Strip non-digits
  const clean = phone.replace(/[^0-9]/g, "");
  let international = clean;
  let local = clean;

  if (clean.startsWith("880")) {
    international = clean;
    local = "0" + clean.slice(3);
  } else if (clean.startsWith("0")) {
    international = "88" + clean;
    local = clean;
  } else if (clean.length === 10 && clean.startsWith("1")) {
    international = "880" + clean;
    local = "0" + clean;
  }

  return { international, local };
}

function calculateDaysDiff(targetDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = targetDateStr.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

function getUrgency(daysDiff: number): "overdue" | "due_today" | "due_soon" | "upcoming" | "later" {
  if (daysDiff < 0) return "overdue";
  if (daysDiff === 0) return "due_today";
  if (daysDiff <= 7) return "due_soon";
  if (daysDiff <= 30) return "upcoming";
  return "later";
}

export async function GET() {
  if (!isDbConfigured || !db) {
    return NextResponse.json({
      alerts: [],
      counts: {
        total: 0,
        overdue: 0,
        dueToday: 0,
        dueSoon: 0,
        upcoming: 0,
        vaccines: 0,
        followUps: 0,
      },
    });
  }

  try {
    const alerts: DueDateAlertItem[] = [];

    // 1. Fetch Vaccinations with due dates for active pets
    const vaccineRows = await db
      .select({
        vacId: vaccinations.id,
        vaccineName: vaccinations.dueDate,
        dueDate: vaccinations.dueDate,
        administeredBy: vaccinations.administeredBy,
        vacNotes: vaccinations.notes,
        actualVaccineName: vaccinations.vaccineName,
        petId: pets.id,
        petName: pets.name,
        species: pets.species,
        breed: pets.breed,
        ownerId: owners.id,
        ownerName: owners.name,
        ownerPhone: owners.phone,
      })
      .from(vaccinations)
      .innerJoin(pets, eq(vaccinations.petId, pets.id))
      .innerJoin(owners, eq(pets.ownerId, owners.id))
      .where(isNotNull(vaccinations.dueDate));

    for (const row of vaccineRows) {
      if (!row.dueDate) continue;
      const daysDiff = calculateDaysDiff(row.dueDate);
      const urgency = getUrgency(daysDiff);

      const phoneInfo = normalizeBangladeshPhone(row.ownerPhone);
      const reminderTitle = `Vaccination Booster: ${row.actualVaccineName}`;

      const message = `Assalamu Alaikum ${row.ownerName},\nThis is a friendly reminder from Shahporan Pet & Vet Care, Sylhet.\nYour pet ${row.petName} (${row.species}) has a scheduled vaccination booster (${row.actualVaccineName}) due on ${row.dueDate}.\n\nPlease visit our clinic at BIDC Point, Shahporan, Sylhet or call 01521765716 to confirm your slot.\nHealthy Animals, Happier Lives!`;

      alerts.push({
        id: `vac-${row.vacId}`,
        sourceType: "vaccination",
        sourceId: row.vacId,
        title: reminderTitle,
        dueDate: row.dueDate,
        daysDiff,
        urgency,
        petId: row.petId,
        petName: row.petName,
        species: row.species,
        breed: row.breed,
        ownerId: row.ownerId,
        ownerName: row.ownerName,
        ownerPhone: row.ownerPhone,
        doctorOrStaff: row.administeredBy,
        notes: row.vacNotes,
        whatsappUrl: `https://wa.me/${phoneInfo.international}?text=${encodeURIComponent(message)}`,
        telUrl: `tel:${phoneInfo.local}`,
        smsUrl: `sms:${phoneInfo.local}?body=${encodeURIComponent(message)}`,
      });
    }

    // 2. Fetch Medical Records with nextVisitDate for active pets
    const medRows = await db
      .select({
        medId: medicalRecords.id,
        nextVisitDate: medicalRecords.nextVisitDate,
        visitType: medicalRecords.visitType,
        diagnosis: medicalRecords.diagnosis,
        attendingDoctor: medicalRecords.attendingDoctor,
        medNotes: medicalRecords.notes,
        petId: pets.id,
        petName: pets.name,
        species: pets.species,
        breed: pets.breed,
        ownerId: owners.id,
        ownerName: owners.name,
        ownerPhone: owners.phone,
      })
      .from(medicalRecords)
      .innerJoin(pets, eq(medicalRecords.petId, pets.id))
      .innerJoin(owners, eq(pets.ownerId, owners.id))
      .where(isNotNull(medicalRecords.nextVisitDate));

    for (const row of medRows) {
      if (!row.nextVisitDate) continue;
      const daysDiff = calculateDaysDiff(row.nextVisitDate);
      const urgency = getUrgency(daysDiff);

      const phoneInfo = normalizeBangladeshPhone(row.ownerPhone);
      const reminderTitle = `Clinical Follow-up (${row.visitType}): ${row.diagnosis || "Post-treatment checkup"}`;

      const message = `Assalamu Alaikum ${row.ownerName},\nThis is a follow-up reminder from Shahporan Pet & Vet Care, Sylhet.\nYour pet ${row.petName} (${row.species}) has a scheduled clinical follow-up visit on ${row.nextVisitDate} (${row.visitType}).\n\nPlease visit our clinic at BIDC Point, Shahporan, Sylhet or call 01521765716 if you need to reschedule.\nThank you!`;

      alerts.push({
        id: `med-${row.medId}`,
        sourceType: "medical_record",
        sourceId: row.medId,
        title: reminderTitle,
        dueDate: row.nextVisitDate,
        daysDiff,
        urgency,
        petId: row.petId,
        petName: row.petName,
        species: row.species,
        breed: row.breed,
        ownerId: row.ownerId,
        ownerName: row.ownerName,
        ownerPhone: row.ownerPhone,
        doctorOrStaff: row.attendingDoctor,
        notes: row.medNotes,
        whatsappUrl: `https://wa.me/${phoneInfo.international}?text=${encodeURIComponent(message)}`,
        telUrl: `tel:${phoneInfo.local}`,
        smsUrl: `sms:${phoneInfo.local}?body=${encodeURIComponent(message)}`,
      });
    }

    // Sort: most urgent first (smallest daysDiff)
    alerts.sort((a, b) => a.daysDiff - b.daysDiff);

    const counts = {
      total: alerts.length,
      overdue: alerts.filter((a) => a.urgency === "overdue").length,
      dueToday: alerts.filter((a) => a.urgency === "due_today").length,
      dueSoon: alerts.filter((a) => a.urgency === "due_soon").length,
      upcoming: alerts.filter((a) => a.urgency === "upcoming").length,
      vaccines: alerts.filter((a) => a.sourceType === "vaccination").length,
      followUps: alerts.filter((a) => a.sourceType === "medical_record").length,
    };

    return NextResponse.json({
      alerts,
      counts,
    });
  } catch (error) {
    console.error("Error in GET /api/alerts/due-dates:", error);
    return NextResponse.json(
      { error: "Failed to load due date alerts", alerts: [], counts: { total: 0, overdue: 0, dueToday: 0, dueSoon: 0, upcoming: 0, vaccines: 0, followUps: 0 } },
      { status: 500 }
    );
  }
}

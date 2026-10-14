import { pgTable, serial, varchar, text, date, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";

// ─── Owners (Customers) ───────────────────────────────────────────────────────
export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Pets ─────────────────────────────────────────────────────────────────────
export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => owners.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  species: varchar("species", { length: 100 }).notNull(), // Dog, Cat, Bird, Cow, Goat, Chicken, etc.
  breed: varchar("breed", { length: 100 }),
  color: varchar("color", { length: 100 }),
  sex: varchar("sex", { length: 10 }), // Male / Female
  dateOfBirth: date("date_of_birth"),
  weight: decimal("weight", { precision: 6, scale: 2 }),
  microchipId: varchar("microchip_id", { length: 100 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Vaccinations ─────────────────────────────────────────────────────────────
export const vaccinations = pgTable("vaccinations", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "cascade" }).notNull(),
  vaccineName: varchar("vaccine_name", { length: 255 }).notNull(),
  dateAdministered: date("date_administered").notNull(),
  dueDate: date("due_date"),
  batchNumber: varchar("batch_number", { length: 100 }),
  administeredBy: varchar("administered_by", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Medical Records ──────────────────────────────────────────────────────────
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "cascade" }).notNull(),
  visitDate: date("visit_date").notNull(),
  visitType: varchar("visit_type", { length: 100 }).notNull(), // Consultation, Deworming, Surgery, Emergency, etc.
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  prescription: text("prescription"),
  weight: decimal("weight", { precision: 6, scale: 2 }),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  nextVisitDate: date("next_visit_date"),
  attendingDoctor: varchar("attending_doctor", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Vaccine, Medicine, Equipment, Supplies
  description: text("description"),
  quantity: integer("quantity").notNull().default(0),
  unit: varchar("unit", { length: 50 }).notNull().default("units"), // units, ml, mg, kg, boxes
  minimumStock: integer("minimum_stock").default(5),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
  supplier: varchar("supplier", { length: 255 }),
  expiryDate: date("expiry_date"),
  batchNumber: varchar("batch_number", { length: 100 }),
  location: varchar("location", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Type exports ─────────────────────────────────────────────────────────────
export type Owner = typeof owners.$inferSelect;
export type NewOwner = typeof owners.$inferInsert;
export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;
export type Vaccination = typeof vaccinations.$inferSelect;
export type NewVaccination = typeof vaccinations.$inferInsert;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type NewMedicalRecord = typeof medicalRecords.$inferInsert;
export type InventoryItem = typeof inventory.$inferSelect;
export type NewInventoryItem = typeof inventory.$inferInsert;

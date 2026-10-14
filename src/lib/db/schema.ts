import { mysqlTable, int, varchar, text, date, timestamp, decimal, boolean } from "drizzle-orm/mysql-core";

// ─── Owners (Customers) ───────────────────────────────────────────────────────
export const owners = mysqlTable("owners", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Pets ─────────────────────────────────────────────────────────────────────
export const pets = mysqlTable("pets", {
  id: int("id").primaryKey().autoincrement(),
  ownerId: int("owner_id").references(() => owners.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  species: varchar("species", { length: 100 }).notNull(), // Dog, Cat, Bird, Cow, Goat, Chicken, etc.
  breed: varchar("breed", { length: 100 }),
  color: varchar("color", { length: 100 }),
  sex: varchar("sex", { length: 10 }), // Male / Female
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  weight: decimal("weight", { precision: 6, scale: 2 }),
  microchipId: varchar("microchip_id", { length: 100 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Vaccinations ─────────────────────────────────────────────────────────────
export const vaccinations = mysqlTable("vaccinations", {
  id: int("id").primaryKey().autoincrement(),
  petId: int("pet_id").references(() => pets.id, { onDelete: "cascade" }).notNull(),
  vaccineName: varchar("vaccine_name", { length: 255 }).notNull(),
  dateAdministered: date("date_administered", { mode: "string" }).notNull(),
  dueDate: date("due_date", { mode: "string" }),
  batchNumber: varchar("batch_number", { length: 100 }),
  administeredBy: varchar("administered_by", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Medical Records ──────────────────────────────────────────────────────────
export const medicalRecords = mysqlTable("medical_records", {
  id: int("id").primaryKey().autoincrement(),
  petId: int("pet_id").references(() => pets.id, { onDelete: "cascade" }).notNull(),
  visitDate: date("visit_date", { mode: "string" }).notNull(),
  visitType: varchar("visit_type", { length: 100 }).notNull(), // Consultation, Deworming, Surgery, Emergency, etc.
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  prescription: text("prescription"),
  weight: decimal("weight", { precision: 6, scale: 2 }),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  nextVisitDate: date("next_visit_date", { mode: "string" }),
  attendingDoctor: varchar("attending_doctor", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventory = mysqlTable("inventory", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Vaccine, Medicine, Equipment, Supplies
  description: text("description"),
  quantity: int("quantity").notNull().default(0),
  unit: varchar("unit", { length: 50 }).notNull().default("units"), // units, ml, mg, kg, boxes
  minimumStock: int("minimum_stock").default(5),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
  supplier: varchar("supplier", { length: 255 }),
  expiryDate: date("expiry_date", { mode: "string" }),
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

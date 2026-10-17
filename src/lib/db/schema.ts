import { pgTable, serial, integer, varchar, text, date, timestamp, numeric, boolean } from "drizzle-orm/pg-core";

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
  species: varchar("species", { length: 100 }).notNull(),
  breed: varchar("breed", { length: 100 }),
  color: varchar("color", { length: 100 }),
  sex: varchar("sex", { length: 10 }),
  dateOfBirth: date("date_of_birth"),
  weight: numeric("weight", { precision: 6, scale: 2 }),
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
  visitType: varchar("visit_type", { length: 100 }).notNull(),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  prescription: text("prescription"),
  weight: numeric("weight", { precision: 6, scale: 2 }),
  temperature: numeric("temperature", { precision: 4, scale: 1 }),
  nextVisitDate: date("next_visit_date"),
  attendingDoctor: varchar("attending_doctor", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(0),
  unit: varchar("unit", { length: 50 }).notNull().default("units"),
  minimumStock: integer("minimum_stock").default(5),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }),
  supplier: varchar("supplier", { length: 255 }),
  expiryDate: date("expiry_date"),
  batchNumber: varchar("batch_number", { length: 100 }),
  location: varchar("location", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Sales (Invoices / Billing) ──────────────────────────────────────────────
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  ownerId: integer("owner_id").references(() => owners.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "set null" }),
  petName: varchar("pet_name", { length: 255 }),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountType: varchar("discount_type", { length: 20 }).default("none").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).default("0.00").notNull(),
  overallDiscountAmount: numeric("overall_discount_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  itemDiscountAmount: numeric("item_discount_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).default("0.00"),
  changeAmount: numeric("change_amount", { precision: 10, scale: 2 }).default("0.00"),
  paymentMethod: varchar("payment_method", { length: 50 }).default("Cash").notNull(),
  paymentReference: varchar("payment_reference", { length: 100 }),
  paymentStatus: varchar("payment_status", { length: 50 }).default("Paid").notNull(),
  doctorOrStaff: varchar("doctor_or_staff", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Sale Items (Line items) ──────────────────────────────────────────────────
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id, { onDelete: "cascade" }).notNull(),
  itemType: varchar("item_type", { length: 50 }).notNull(),
  inventoryId: integer("inventory_id").references(() => inventory.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).default("0.00").notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paidTo: varchar("paid_to", { length: 255 }),
  notes: text("notes"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
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
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

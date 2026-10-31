import { neon } from "@neondatabase/serverless";
import { isDbConfigured } from "./index";

const CREATE_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    color VARCHAR(100),
    sex VARCHAR(10),
    date_of_birth DATE,
    weight NUMERIC(6, 2),
    microchip_id VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS vaccinations (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    date_administered DATE NOT NULL,
    due_date DATE,
    batch_number VARCHAR(100),
    administered_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visit_type VARCHAR(100) NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    weight NUMERIC(6, 2),
    temperature NUMERIC(4, 1),
    next_visit_date DATE,
    attending_doctor VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'units',
    minimum_stock INTEGER DEFAULT 5,
    cost_price NUMERIC(10, 2),
    selling_price NUMERIC(10, 2),
    supplier VARCHAR(255),
    expiry_date DATE,
    batch_number VARCHAR(100),
    location VARCHAR(100),
    concentration VARCHAR(100),
    medicine_source VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS consultation_settings (
    id SERIAL PRIMARY KEY,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS clinic_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    concentration VARCHAR(100),
    weight_kg NUMERIC(6, 2) NOT NULL,
    dose_mg_per_kg NUMERIC(8, 3) NOT NULL,
    calculated_dose_mg NUMERIC(10, 3) NOT NULL,
    calculated_volume_ml NUMERIC(10, 3),
    prescription_group_id VARCHAR(36),
    route VARCHAR(100),
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100),
    instructions TEXT,
    diagnosis TEXT,
    advice TEXT,
    follow_up_date DATE,
    source_name VARCHAR(255) NOT NULL,
    source_reference VARCHAR(500),
    clinician_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS route VARCHAR(100)`,
  `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS calculated_volume_ml NUMERIC(10, 3)`,
  `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS prescription_group_id VARCHAR(36)`,
  `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS diagnosis TEXT`,
  `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS advice TEXT`,
  `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS follow_up_date DATE`,

  `ALTER TABLE inventory ADD COLUMN IF NOT EXISTS concentration VARCHAR(100)`,
  `ALTER TABLE inventory ADD COLUMN IF NOT EXISTS medicine_source VARCHAR(500)`,
  `CREATE TABLE IF NOT EXISTS prescription_medicines (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    concentration VARCHAR(100),
    dose_mg_per_kg NUMERIC(8, 3),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE prescription_medicines ADD COLUMN IF NOT EXISTS dose_mg_per_kg NUMERIC(8, 3)`,

  `INSERT INTO clinic_services (name, fee) VALUES
    ('General Consultation Fee', 300),
    ('Follow-up Consultation Fee', 150),
    ('Vaccination Administration Fee', 100),
    ('Deworming Administration Fee', 100),
    ('Wound Dressing / Minor Care', 250),
    ('Diagnostic Test Fee (Lab)', 500),
    ('Surgery / Procedure Fee', 1500)
    ON CONFLICT (name) DO NOTHING`,

  `CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
    pet_name VARCHAR(255),
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'none' NOT NULL,
    discount_value NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    change_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'Cash' NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Paid' NOT NULL,
    doctor_or_staff VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    paid_to VARCHAR(255),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  `ALTER TABLE sales ADD COLUMN IF NOT EXISTS overall_discount_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL`,
  `ALTER TABLE sales ADD COLUMN IF NOT EXISTS item_discount_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL`,
  `ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100)`,
  `ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) DEFAULT 0.00 NOT NULL`,
  `ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL`,
];

// Seed items run one-by-one to avoid multi-statement errors
const SEED_INVENTORY_SQL = [
  `INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
   VALUES ('FVRCP Vaccine', 'Vaccine', 20, 'doses', 10, 500)
   ON CONFLICT DO NOTHING`,

  `INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
   VALUES ('Rabies Vaccine', 'Vaccine', 30, 'doses', 15, 600)
   ON CONFLICT DO NOTHING`,

  `INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
   VALUES ('DHPPL Vaccine', 'Vaccine', 25, 'doses', 10, 550)
   ON CONFLICT DO NOTHING`,

  `INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
   VALUES ('Deworming Tablets (Cat)', 'Medicine', 100, 'tablets', 20, 50)
   ON CONFLICT DO NOTHING`,

  `INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
   VALUES ('Deworming Tablets (Dog)', 'Medicine', 100, 'tablets', 20, 60)
   ON CONFLICT DO NOTHING`,

  `INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
   VALUES ('Amoxicillin 250mg', 'Medicine', 200, 'tablets', 50, 15)
   ON CONFLICT DO NOTHING`,

  `INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
   VALUES ('Syringes 5ml', 'Supplies', 500, 'units', 100, 5)
   ON CONFLICT DO NOTHING`,

  `INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
   VALUES ('Examination Gloves', 'Supplies', 1000, 'units', 200, 3)
   ON CONFLICT DO NOTHING`,

  `INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
   VALUES ('Stethoscope', 'Equipment', 3, 'units', 1, NULL)
   ON CONFLICT DO NOTHING`,

  `INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
   VALUES ('Digital Thermometer', 'Equipment', 5, 'units', 2, NULL)
   ON CONFLICT DO NOTHING`,
];

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export async function ensureTablesExist() {
  if (isInitialized) return;
  if (initializationPromise) return initializationPromise;
  if (!isDbConfigured || !process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured. Please set a valid Neon PostgreSQL connection string."
    );
  }

  initializationPromise = (async () => {
    const sqlClient = neon(process.env.DATABASE_URL!);

    // Run each statement individually — Neon HTTP driver does not support
    // multiple commands in a single prepared statement call.
    for (const statement of CREATE_TABLES_SQL) {
      await sqlClient.query(statement);
    }

    for (const statement of SEED_INVENTORY_SQL) {
      await sqlClient.query(statement);
    }

    isInitialized = true;
  })();

  try {
    await initializationPromise;
  } catch (error) {
    initializationPromise = null;
    throw error;
  }
}

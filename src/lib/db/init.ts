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
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

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

export async function ensureTablesExist() {
  if (isInitialized) return;
  if (!isDbConfigured || !process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured. Please set a valid Neon PostgreSQL connection string."
    );
  }

  const sqlClient = neon(process.env.DATABASE_URL);

  // Run each statement individually — Neon HTTP driver does not support
  // multiple commands in a single prepared statement call
  for (const statement of CREATE_TABLES_SQL) {
    await sqlClient.query(statement);
  }

  for (const statement of SEED_INVENTORY_SQL) {
    await sqlClient.query(statement);
  }

  isInitialized = true;
}

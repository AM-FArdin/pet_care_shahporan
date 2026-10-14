import { sql, isDbConfigured } from "./index";

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS owners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pets (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  species VARCHAR(100) NOT NULL,
  breed VARCHAR(100),
  color VARCHAR(100),
  sex VARCHAR(10),
  date_of_birth DATE,
  weight DECIMAL(6, 2),
  microchip_id VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vaccinations (
  id SERIAL PRIMARY KEY,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  vaccine_name VARCHAR(255) NOT NULL,
  date_administered DATE NOT NULL,
  due_date DATE,
  batch_number VARCHAR(100),
  administered_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS medical_records (
  id SERIAL PRIMARY KEY,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_type VARCHAR(100) NOT NULL,
  diagnosis TEXT,
  treatment TEXT,
  prescription TEXT,
  weight DECIMAL(6, 2),
  temperature DECIMAL(4, 1),
  next_visit_date DATE,
  attending_doctor VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'units',
  minimum_stock INTEGER DEFAULT 5,
  cost_price DECIMAL(10, 2),
  selling_price DECIMAL(10, 2),
  supplier VARCHAR(255),
  expiry_date DATE,
  batch_number VARCHAR(100),
  location VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
`;

const SEED_INVENTORY_SQL = `
INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'FVRCP Vaccine', 'Vaccine', 20, 'doses', 10, 500
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'FVRCP Vaccine');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Rabies Vaccine', 'Vaccine', 30, 'doses', 15, 600
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Rabies Vaccine');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'DHPPL Vaccine', 'Vaccine', 25, 'doses', 10, 550
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'DHPPL Vaccine');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Deworming Tablets (Cat)', 'Medicine', 100, 'tablets', 20, 50
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Deworming Tablets (Cat)');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Deworming Tablets (Dog)', 'Medicine', 100, 'tablets', 20, 60
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Deworming Tablets (Dog)');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Amoxicillin 250mg', 'Medicine', 200, 'tablets', 50, 15
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Amoxicillin 250mg');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Syringes 5ml', 'Supplies', 500, 'units', 100, 5
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Syringes 5ml');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Examination Gloves', 'Supplies', 1000, 'units', 200, 3
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Examination Gloves');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Stethoscope', 'Equipment', 3, 'units', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Stethoscope');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Digital Thermometer', 'Equipment', 5, 'units', 2, NULL
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Digital Thermometer');
`;

let isInitialized = false;

export async function ensureTablesExist() {
  if (isInitialized) return;
  if (!isDbConfigured) {
    throw new Error("DATABASE_URL is not configured. Please add DATABASE_URL in Vercel project settings.");
  }

  // Split and run each statement
  const statements = (INIT_SQL + "\n" + SEED_INVENTORY_SQL)
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.unsafe(statement);
  }

  isInitialized = true;
}

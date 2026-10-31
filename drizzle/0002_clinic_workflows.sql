ALTER TABLE inventory ADD COLUMN IF NOT EXISTS concentration VARCHAR(100);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS medicine_source VARCHAR(500);

CREATE TABLE IF NOT EXISTS consultation_settings (
  id SERIAL PRIMARY KEY,
  consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS clinic_services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

INSERT INTO clinic_services (name, fee) VALUES
  ('General Consultation Fee', 300),
  ('Follow-up Consultation Fee', 150),
  ('Vaccination Administration Fee', 100),
  ('Deworming Administration Fee', 100),
  ('Wound Dressing / Minor Care', 250),
  ('Diagnostic Test Fee (Lab)', 500),
  ('Surgery / Procedure Fee', 1500)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS prescriptions (
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
);

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS route VARCHAR(100);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS calculated_volume_ml NUMERIC(10, 3);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS prescription_group_id VARCHAR(36);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS advice TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS follow_up_date DATE;

CREATE TABLE IF NOT EXISTS prescription_medicines (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  concentration VARCHAR(100),
  dose_mg_per_kg NUMERIC(8, 3),
  dose_unit VARCHAR(10) NOT NULL DEFAULT 'mg/kg',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
ALTER TABLE prescription_medicines ADD COLUMN IF NOT EXISTS dose_mg_per_kg NUMERIC(8, 3);
ALTER TABLE prescription_medicines ADD COLUMN IF NOT EXISTS dose_unit VARCHAR(10) NOT NULL DEFAULT 'mg/kg';

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
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100),
  instructions TEXT,
  source_name VARCHAR(255) NOT NULL,
  source_reference VARCHAR(500),
  clinician_verified BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

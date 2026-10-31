ALTER TABLE prescription_medicines
  ADD COLUMN IF NOT EXISTS dose_unit VARCHAR(10) NOT NULL DEFAULT 'mg/kg';

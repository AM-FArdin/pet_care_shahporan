-- Create owners table
CREATE TABLE IF NOT EXISTS owners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create pets table
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

-- Create vaccinations table
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

-- Create medical_records table
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

-- Create inventory table
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

-- Seed some inventory items
INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price) VALUES
('FVRCP Vaccine', 'Vaccine', 20, 'doses', 10, 500),
('Rabies Vaccine', 'Vaccine', 30, 'doses', 15, 600),
('DHPPL Vaccine', 'Vaccine', 25, 'doses', 10, 550),
('Deworming Tablets (Cat)', 'Medicine', 100, 'tablets', 20, 50),
('Deworming Tablets (Dog)', 'Medicine', 100, 'tablets', 20, 60),
('Amoxicillin 250mg', 'Medicine', 200, 'tablets', 50, 15),
('Syringes 5ml', 'Supplies', 500, 'units', 100, 5),
('Examination Gloves', 'Supplies', 1000, 'units', 200, 3),
('Stethoscope', 'Equipment', 3, 'units', 1, NULL),
('Digital Thermometer', 'Equipment', 5, 'units', 2, NULL)
ON CONFLICT DO NOTHING;

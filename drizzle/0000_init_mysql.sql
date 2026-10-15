-- Shahporan Pet & Vet Care — MySQL Database Initialization
CREATE DATABASE IF NOT EXISTS shahporan_vet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shahporan_vet;

-- Create owners table
CREATE TABLE IF NOT EXISTS owners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_pets_owner FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
  vaccine_name VARCHAR(255) NOT NULL,
  date_administered DATE NOT NULL,
  due_date DATE,
  batch_number VARCHAR(100),
  administered_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_vax_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_med_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  quantity INT NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'units',
  minimum_stock INT DEFAULT 5,
  cost_price DECIMAL(10, 2),
  selling_price DECIMAL(10, 2),
  supplier VARCHAR(255),
  expiry_date DATE,
  batch_number VARCHAR(100),
  location VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial inventory items
INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'FVRCP Vaccine', 'Vaccine', 20, 'doses', 10, 500
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'FVRCP Vaccine');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Rabies Vaccine', 'Vaccine', 30, 'doses', 15, 600
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Rabies Vaccine');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'DHPPL Vaccine', 'Vaccine', 25, 'doses', 10, 550
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'DHPPL Vaccine');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Deworming Tablets (Cat)', 'Medicine', 100, 'tablets', 20, 50
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Deworming Tablets (Cat)');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Deworming Tablets (Dog)', 'Medicine', 100, 'tablets', 20, 60
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Deworming Tablets (Dog)');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Amoxicillin 250mg', 'Medicine', 200, 'tablets', 50, 15
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Amoxicillin 250mg');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Syringes 5ml', 'Supplies', 500, 'units', 100, 5
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Syringes 5ml');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Examination Gloves', 'Supplies', 1000, 'units', 200, 3
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Examination Gloves');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Stethoscope', 'Equipment', 3, 'units', 1, NULL
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Stethoscope');

INSERT INTO inventory (name, category, quantity, unit, minimum_stock, selling_price)
SELECT 'Digital Thermometer', 'Equipment', 5, 'units', 2, NULL
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = 'Digital Thermometer');

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  owner_id INT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  pet_id INT NULL,
  pet_name VARCHAR(255),
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_type VARCHAR(20) DEFAULT 'none' NOT NULL,
  discount_value DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0.00,
  change_amount DECIMAL(10, 2) DEFAULT 0.00,
  payment_method VARCHAR(50) DEFAULT 'Cash' NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'Paid' NOT NULL,
  doctor_or_staff VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_sales_owner FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL,
  CONSTRAINT fk_sales_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  inventory_id INT NULL,
  name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

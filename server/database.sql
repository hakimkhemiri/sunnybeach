-- Create database
CREATE DATABASE IF NOT EXISTS sunny_beach;
USE sunny_beach;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create table_types table
CREATE TABLE IF NOT EXISTS table_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity_min INT NOT NULL,
  capacity_max INT NOT NULL,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  table_type_id INT NOT NULL,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  num_people INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (table_type_id) REFERENCES table_types(id)
);

-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create food_orders table
CREATE TABLE IF NOT EXISTS food_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reservation_id INT,
  order_type VARCHAR(20) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  delivery_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL
);

-- Create food_order_items table
CREATE TABLE IF NOT EXISTS food_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  food_order_id INT NOT NULL,
  food_item_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (food_order_id) REFERENCES food_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES food_items(id)
);

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (email, password, is_admin) 
VALUES ('admin@gmail.com', '$2a$10$rY8qF0N8KQzWQjM5vN3Y8u3vL0jN8KQzWQjM5vN3Y8u3vL0jN8KQzW', TRUE)
ON DUPLICATE KEY UPDATE email=email;

-- Insert default table types
INSERT INTO table_types (name, capacity_min, capacity_max, price_per_hour) VALUES
('Parasol', 1, 4, 15.00),
('Mini Cabane', 1, 5, 25.00),
('Cabane', 6, 20, 35.00)
ON DUPLICATE KEY UPDATE name=name;

-- Insert default food items
INSERT INTO food_items (name, description, price, category) VALUES
('Salade Niçoise', 'Salade traditionnelle avec tomates, œufs et thon', 12.00, 'appetizer'),
('Bouillabaisse', 'Soupe de poisson méditerranéenne', 18.00, 'main'),
('Branzino Grillé', 'Poisson grillé frais du jour', 28.00, 'main'),
('Pâtes Carbonara', 'Pâtes crémeuses à l''italienne', 15.00, 'main'),
('Tiramisu', 'Dessert italien traditionnel', 8.00, 'dessert'),
('Tarte au Citron', 'Tarte au citron frais', 8.00, 'dessert'),
('Vin Blanc Sec', 'Vin blanc local', 6.00, 'drink'),
('Eau Pétillante', 'Eau minérale pétillante', 3.00, 'drink')
ON DUPLICATE KEY UPDATE name=name;

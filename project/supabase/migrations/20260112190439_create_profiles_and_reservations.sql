/*
  # Create profiles, table reservations, and food ordering system

  ## Overview
  Complete system for restaurant reservations including user profiles, table bookings, and food orders.

  ## New Tables
    - `profiles`
      - `id` (uuid, primary key): User ID from auth.users
      - `email` (text): User email
      - `first_name` (text): User first name
      - `last_name` (text): User last name
      - `phone` (text): Contact phone
      - `address` (text): User address
      - `created_at` (timestamptz): Profile creation date
      - `updated_at` (timestamptz): Last update

    - `table_types`
      - `id` (uuid, primary key): Table type ID
      - `name` (text): Type name (Parasol, Mini Cabane, Cabane)
      - `capacity_min` (integer): Minimum capacity
      - `capacity_max` (integer): Maximum capacity
      - `price_per_hour` (decimal): Price per hour in DT

    - `reservations`
      - `id` (uuid, primary key): Reservation ID
      - `user_id` (uuid): User making reservation
      - `table_type_id` (uuid): Type of table
      - `reservation_date` (date): Date of reservation
      - `start_time` (time): Start time
      - `end_time` (time): End time
      - `num_people` (integer): Number of people
      - `total_price` (decimal): Total reservation price
      - `status` (text): confirmed/pending/cancelled
      - `created_at` (timestamptz): Creation date

    - `food_items`
      - `id` (uuid, primary key): Food item ID
      - `name` (text): Dish name
      - `description` (text): Description
      - `price` (decimal): Price in DT
      - `category` (text): Category (appetizer, main, dessert, drink)
      - `available` (boolean): If available
      - `created_at` (timestamptz): Creation date

    - `food_orders`
      - `id` (uuid, primary key): Order ID
      - `user_id` (uuid): User ordering
      - `reservation_id` (uuid, optional): Associated reservation if sur place
      - `order_type` (text): enligne or sur_place
      - `total_price` (decimal): Order total
      - `status` (text): pending/confirmed/ready/completed
      - `delivery_address` (text, optional): For enligne orders
      - `created_at` (timestamptz): Order creation date

    - `food_order_items`
      - `id` (uuid, primary key): Line item ID
      - `food_order_id` (uuid): Associated order
      - `food_item_id` (uuid): Food item
      - `quantity` (integer): Quantity ordered
      - `unit_price` (decimal): Price at time of order

  ## Security
    - Enable RLS on all tables
    - Users can only view/edit their own profiles
    - Users can only view/edit their own reservations and orders
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS table_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity_min integer NOT NULL,
  capacity_max integer NOT NULL,
  price_per_hour decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_type_id uuid NOT NULL REFERENCES table_types(id),
  reservation_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  num_people integer NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10, 2) NOT NULL,
  category text NOT NULL,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES reservations(id),
  order_type text NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending',
  delivery_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_order_id uuid NOT NULL REFERENCES food_orders(id) ON DELETE CASCADE,
  food_item_id uuid NOT NULL REFERENCES food_items(id),
  quantity integer NOT NULL,
  unit_price decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Everyone can view table types"
  ON table_types FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view available food items"
  ON food_items FOR SELECT
  TO anon, authenticated
  USING (available = true);

CREATE POLICY "Users can view own food orders"
  ON food_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create food orders"
  ON food_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own order items"
  ON food_order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM food_orders
      WHERE food_orders.id = food_order_items.food_order_id
      AND food_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders"
  ON food_order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM food_orders
      WHERE food_orders.id = food_order_items.food_order_id
      AND food_orders.user_id = auth.uid()
    )
  );

INSERT INTO table_types (name, capacity_min, capacity_max, price_per_hour)
VALUES
  ('Parasol', 1, 4, 15),
  ('Mini Cabane', 1, 5, 25),
  ('Cabane', 6, 20, 35);

INSERT INTO food_items (name, description, price, category)
VALUES
  ('Salade Niçoise', 'Salade traditionnelle avec tomates, œufs et thon', 12, 'appetizer'),
  ('Bouillabaisse', 'Soupe de poisson méditerranéenne', 18, 'main'),
  ('Branzino Grillé', 'Poisson grillé frais du jour', 28, 'main'),
  ('Pâtes Carbonara', 'Pâtes crémeuses à l''italienne', 15, 'main'),
  ('Tiramisu', 'Dessert italien traditionnel', 8, 'dessert'),
  ('Tarte au Citron', 'Tarte au citron frais', 8, 'dessert'),
  ('Vin Blanc Sec', 'Vin blanc local', 6, 'drink'),
  ('Eau Pétillante', 'Eau minérale pétillante', 3, 'drink');

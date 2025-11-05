/*
  # Create Users and Items Tables for Inventory System

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Auto-generated user ID
      - `username` (text, unique) - Username for login
      - `password` (text) - Hashed password using bcrypt
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `items`
      - `id` (serial, primary key) - Auto-incrementing item ID
      - `name` (varchar 255) - Item name
      - `sku` (varchar 50, unique) - Stock Keeping Unit (unique code)
      - `quantity` (integer) - Stock quantity (min 0)
      - `price` (numeric 10,2) - Unit price
      - `description` (text, nullable) - Item description
      - `category` (varchar 100, nullable) - Item category
      - `user_id` (uuid) - Reference to user who created the item
      - `created_at` (timestamptz) - Item creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Users can only read their own user data
    - Users can only manage (CRUD) their own items
    - Passwords are stored hashed (handled in application layer)

  3. Important Notes
    - Using uuid for users table to match Supabase auth
    - Using serial for items table as requested
    - SKU must be unique across all users
    - Quantity must be >= 0
    - Price uses numeric type for precision
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  sku varchar(50) UNIQUE NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  description text,
  category varchar(100),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS Policies for items table
CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
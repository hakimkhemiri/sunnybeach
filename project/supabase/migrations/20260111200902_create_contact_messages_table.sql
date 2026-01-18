/*
  # Create contact messages table for restaurant app

  ## Overview
  This migration creates the infrastructure for handling contact form submissions from restaurant customers.

  ## New Tables
    - `contact_messages`
      - `id` (uuid, primary key): Unique identifier for each message
      - `name` (text): Name of the person sending the message
      - `email` (text): Email address for replies
      - `phone` (text, optional): Phone number for contact
      - `message` (text): The actual message content
      - `created_at` (timestamptz): Timestamp when message was sent
      - `user_id` (uuid, optional): Reference to auth.users if user is logged in

  ## Security
    - Enable RLS on `contact_messages` table
    - Add policy for anyone to create contact messages (public form)
    - Add policy for authenticated users to read their own messages
*/

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send contact messages"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

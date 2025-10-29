/*
  # Create languages table

  1. New Tables
    - `languages`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Language code like 'en', 'es'
      - `label` (text) - Display name like 'English', 'Spanish'
      - `tts_voice_tag` (text) - TTS voice identifier
      - `is_default` (boolean) - Whether this is the default language
      - `user_id` (uuid, foreign key) - Links to auth.users
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `languages` table
    - Add policy for authenticated users to manage their own languages
*/

CREATE TABLE IF NOT EXISTS languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  label text NOT NULL,
  tts_voice_tag text NOT NULL,
  is_default boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint on code per user
CREATE UNIQUE INDEX IF NOT EXISTS languages_user_code_unique 
ON languages(user_id, code);

-- Create unique constraint to ensure only one default per user
CREATE UNIQUE INDEX IF NOT EXISTS languages_user_default_unique 
ON languages(user_id) WHERE is_default = true;

-- Enable RLS
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own languages
CREATE POLICY "Users can manage own languages"
  ON languages
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_languages_updated_at
  BEFORE UPDATE ON languages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
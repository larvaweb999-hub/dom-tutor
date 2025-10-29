/*
  # Create AI providers table

  1. New Tables
    - `ai_providers`
      - `id` (uuid, primary key)
      - `name` (text) - Provider name like 'OpenAI', 'Anthropic'
      - `api_url` (text) - API endpoint URL
      - `model` (text) - Model identifier like 'gpt-4', 'claude-3'
      - `logo_url` (text, optional) - URL to provider logo
      - `languages_supported` (text array) - Supported language codes
      - `api_key_encrypted` (text) - Encrypted API key
      - `user_id` (uuid, foreign key) - Links to auth.users
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ai_providers` table
    - Add policy for authenticated users to manage their own providers
*/

CREATE TABLE IF NOT EXISTS ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_url text NOT NULL,
  model text NOT NULL,
  logo_url text,
  languages_supported text[] DEFAULT '{}',
  api_key_encrypted text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS ai_providers_user_id_idx ON ai_providers(user_id);

-- Enable RLS
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own AI providers
CREATE POLICY "Users can manage own ai_providers"
  ON ai_providers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_ai_providers_updated_at
  BEFORE UPDATE ON ai_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
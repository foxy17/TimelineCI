/*
  # Add updated_at column to microservices table

  1. Changes
    - Add updated_at column to microservices table
    - Create trigger to automatically update the timestamp on changes
  
  2. Security
    - No security changes needed, existing RLS policies will continue to work
*/

-- Add updated_at column to microservices table
ALTER TABLE microservices 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to have the updated_at value set to created_at
UPDATE microservices 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_microservices_updated_at
    BEFORE UPDATE ON microservices
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 
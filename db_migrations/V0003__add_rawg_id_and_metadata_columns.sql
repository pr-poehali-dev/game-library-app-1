-- Add rawg_id column to games table for tracking synced games
ALTER TABLE games ADD COLUMN IF NOT EXISTS rawg_id INTEGER UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_games_rawg_id ON games(rawg_id);

-- Add developer and publisher columns if not exist
ALTER TABLE games ADD COLUMN IF NOT EXISTS developer VARCHAR(255);
ALTER TABLE games ADD COLUMN IF NOT EXISTS publisher VARCHAR(255);

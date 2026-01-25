-- Migration script to change table_type_id to table_type
-- Run this in phpMyAdmin on the sunny_beach database

USE sunny_beach;

-- Step 1: Check if table_type column already exists, if not add it
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sunny_beach' 
  AND TABLE_NAME = 'reservations' 
  AND COLUMN_NAME = 'table_type'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE reservations ADD COLUMN table_type VARCHAR(100) AFTER user_id',
  'SELECT "Column table_type already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Update existing data (if any reservations exist)
UPDATE reservations 
SET table_type = 'Parasol' 
WHERE table_type IS NULL OR table_type = '';

-- Step 3: Drop foreign key constraint if it exists
SET @fk_name = (
  SELECT CONSTRAINT_NAME 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = 'sunny_beach' 
  AND TABLE_NAME = 'reservations' 
  AND COLUMN_NAME = 'table_type_id'
  AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

SET @sql = IF(@fk_name IS NOT NULL,
  CONCAT('ALTER TABLE reservations DROP FOREIGN KEY ', @fk_name),
  'SELECT "No foreign key to drop" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Drop the old column if it exists
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sunny_beach' 
  AND TABLE_NAME = 'reservations' 
  AND COLUMN_NAME = 'table_type_id'
);

SET @sql = IF(@col_exists > 0,
  'ALTER TABLE reservations DROP COLUMN table_type_id',
  'SELECT "Column table_type_id does not exist" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed!' AS status;

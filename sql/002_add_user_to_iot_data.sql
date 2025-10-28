-- Add user_email column to iot_data table
ALTER TABLE iot_data 
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);

-- Create index for faster filtering by user
CREATE INDEX IF NOT EXISTS idx_iot_data_user_email ON iot_data(user_email);

-- Add foreign key constraint (optional, but recommended)
ALTER TABLE iot_data 
ADD CONSTRAINT fk_iot_data_user 
FOREIGN KEY (user_email) 
REFERENCES users(email) 
ON DELETE CASCADE;

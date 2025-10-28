import { config } from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Create pool after environment variables are loaded
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');
    
    // Read and execute SQL files in order
    const sqlFiles = [
      '001_create_users_table.sql',
      '002_add_user_to_iot_data.sql'
    ];
    
    for (const file of sqlFiles) {
      console.log(`Running ${file}...`);
      const sql = fs.readFileSync(
        path.join(process.cwd(), 'sql', file),
        'utf8'
      );
      await client.query(sql);
      console.log(`✓ ${file} completed`);
    }
    
    console.log('\n✓ All migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

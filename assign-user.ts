import { config } from 'dotenv';
import { resolve } from 'path';
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

async function assignUser() {
  const client = await pool.connect();
  
  try {
    const userEmail = 'andrew.rusli@gmail.com';
    
    console.log(`Assigning all data to user: ${userEmail}`);
    
    // First, ensure the user exists
    console.log('Creating/verifying user...');
    await client.query(`
      INSERT INTO users (email, created_at, last_login) 
      VALUES ($1, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE 
      SET last_login = NOW()
    `, [userEmail]);
    
    console.log('✓ User created/verified');
    
    // Count existing data without user assignment
    const countResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM iot_data 
      WHERE user_email IS NULL
    `);
    
    const nullCount = parseInt(countResult.rows[0].count);
    console.log(`Found ${nullCount} data points without user assignment`);
    
    if (nullCount > 0) {
      // Assign all data to the user
      console.log('Assigning data points to user...');
      const updateResult = await client.query(`
        UPDATE iot_data 
        SET user_email = $1 
        WHERE user_email IS NULL
      `, [userEmail]);
      
      console.log(`✓ Updated ${updateResult.rowCount} data points`);
    }
    
    // Show total data for this user
    const totalResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM iot_data 
      WHERE user_email = $1
    `, [userEmail]);
    
    console.log(`\n✓ Total data points for ${userEmail}: ${totalResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error assigning user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

assignUser();

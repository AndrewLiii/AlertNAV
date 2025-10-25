import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      WITH RankedData AS (
        SELECT 
          device_id,
          lat as latitude,
          lon as longitude,
          timestamp,
          ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY timestamp DESC) as rn
        FROM iot_data
      )
      SELECT 
        device_id,
        CAST(latitude AS FLOAT) as latitude,
        CAST(longitude AS FLOAT) as longitude,
        timestamp
      FROM RankedData 
      WHERE rn = 1 
      AND latitude IS NOT NULL 
      AND longitude IS NOT NULL
    `);
    client.release();
    return NextResponse.json({
      data: result.rows
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
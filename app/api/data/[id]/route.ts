import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { DeviceData } from '@/types/data';

// GET endpoint to fetch specific device data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Await params first
    
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        id,
        device_id,
        lat,
        lon,
        event,
        "group",
        timestamp
      FROM iot_data
      WHERE id = $1
    `, [parseInt(id)]);
    
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// PUT endpoint to update device data
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data: DeviceData = await request.json();
    const client = await pool.connect();

    // Update only event and group
    const result = await client.query(`
      UPDATE iot_data
      SET 
        event = $1,
        "group" = $2
      WHERE id = $3
      RETURNING *
    `, [
      data.event,
      data.group,
      parseInt(id)
    ]);

    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}
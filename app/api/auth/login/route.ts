import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Check if user exists
      let result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      let user = result.rows[0];

      // If user doesn't exist, create them
      if (!user) {
        const insertResult = await client.query(
          'INSERT INTO users (email, created_at, last_login) VALUES ($1, NOW(), NOW()) RETURNING *',
          [email.toLowerCase()]
        );
        user = insertResult.rows[0];
      } else {
        // Update last login
        await client.query(
          'UPDATE users SET last_login = NOW() WHERE email = $1',
          [email.toLowerCase()]
        );
      }

      // Create a simple session token (in production, use proper JWT or session management)
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email
        }
      });

      // Set cookie with email for session management
      response.cookies.set('user_email', user.email, {
        httpOnly: true,
        secure: false, // Set to true once HTTPS is configured on ALB
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}

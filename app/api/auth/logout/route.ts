import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the session cookie
  response.cookies.set('user_email', '', {
    httpOnly: true,
    secure: false, // Set to true once HTTPS is configured on ALB
    sameSite: 'lax',
    maxAge: 0
  });

  return response;
}

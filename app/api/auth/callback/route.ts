import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new Response('Missing env vars', { status: 500 });
  }

  const response = await fetch('https://moneybird.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return new Response(`Error fetching token: ${error}`, { status: 500 });
  }

  const data = await response.json();
  const accessToken = data.access_token;
  
  // Store token in cookie
  const cookieStore = await cookies();
  cookieStore.set('moneybird_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  redirect('/');
}

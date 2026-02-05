import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  const cookieStore = await cookies();
  const oauthConfig = cookieStore.get('moneybird_oauth_config')?.value;
  let clientId: string | undefined;
  let clientSecret: string | undefined;
  let redirectUri: string | undefined;

  if (oauthConfig) {
    try {
      const parsed = JSON.parse(oauthConfig) as {
        clientId?: string;
        clientSecret?: string;
        redirectUri?: string;
      };
      clientId = parsed.clientId;
      clientSecret = parsed.clientSecret;
      redirectUri = parsed.redirectUri;
    } catch {
      return new Response('Invalid OAuth config', { status: 400 });
    }
  }

  if (!clientId || !clientSecret || !redirectUri) {
    return new Response('Missing OAuth credentials', { status: 500 });
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
  cookieStore.set('moneybird_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  cookieStore.delete('moneybird_oauth_config');

  let targetOrigin = request.nextUrl.origin;
  let basePath = request.nextUrl.basePath ?? '';

  if (redirectUri) {
    try {
      const redirectUrl = new URL(redirectUri);
      targetOrigin = redirectUrl.origin;
      const callbackPath = '/api/auth/callback';
      if (redirectUrl.pathname.endsWith(callbackPath)) {
        basePath = redirectUrl.pathname.slice(0, -callbackPath.length);
      } else {
        basePath = redirectUrl.pathname.replace(/\/$/, '');
      }
    } catch {
      // ignore invalid redirectUri; fall back to request-based origin
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedHost) {
    targetOrigin = `${forwardedProto ?? 'https'}://${forwardedHost}`;
  }

  const target = new URL(targetOrigin);
  target.pathname = `${basePath}/`;

  redirect(target.toString());
}

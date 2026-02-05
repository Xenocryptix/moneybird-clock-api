import { redirect } from 'next/navigation';

export async function GET() {
  const clientId = process.env.CLIENT_ID;
  const redirectUri = process.env.REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new Response('Missing CLIENT_ID or REDIRECT_URI', { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'time_entries',
  });

  redirect(`https://moneybird.com/oauth/authorize?${params.toString()}`);
}

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
    scope: 'sales_invoices time_entries settings',
    // Moneybird docs say: "The scope parameter is optional. If you don't specify a scope, the access token will have access to all resources."
    // So I will omit scope to get full access as per instructions "integrate with the Moneybird API".
  });

  redirect(`https://moneybird.com/oauth/authorize?${params.toString()}`);
}

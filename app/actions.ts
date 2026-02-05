'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BASE_URL = 'https://moneybird.com/api/v2';
const ADMINISTRATION_ID = process.env.ADMINISTRATION_ID;
const REQUEST_TOKEN = process.env.REQUEST_TOKEN;

type TimeEntry = {
  id: string;
  user_id: string | number;
  description: string;
  started_at: string;
  ended_at?: string | null;
};

if (!ADMINISTRATION_ID) {
  throw new Error('ADMINISTRATION_ID is not set');
}

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get('moneybird_token')?.value;
}

export async function checkAuth() {
  const token = await getToken();
  return !!token;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('moneybird_token');
  redirect('/'); 
}

export async function setManualToken(formData: FormData) {
  const token = formData.get('token');
  if (typeof token === 'string' && token.trim()) {
    const cookieStore = await cookies();
    cookieStore.set('moneybird_token', token.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 400, // 400 days
    });
  }
  redirect('/');
}

export async function startManualAuth(formData: FormData) {
  const clientId = formData.get('client_id')?.toString();
  const clientSecret = formData.get('client_secret')?.toString();
  const redirectUri = formData.get('redirect_uri')?.toString();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing credentials');
  }

  const cookieStore = await cookies();
  cookieStore.set('moneybird_oauth_config', JSON.stringify({ clientId, clientSecret, redirectUri }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'time_entries settings',
  });

  redirect(`https://moneybird.com/oauth/authorize?${params.toString()}`);
}

async function fetchMoneybird(endpoint: string, options: RequestInit = {}, authToken?: string) {
  const token = authToken || await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${BASE_URL}/${ADMINISTRATION_ID}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Token expired or invalid
    // In a real app, handle refresh or logout
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Moneybird API error: ${res.status} ${text}`);
  }

  return res.json();
}

export async function getData() {
  try {
    const [users, projects, contacts] = await Promise.all([
      fetchMoneybird('/users.json'),
      fetchMoneybird('/projects.json'),
      fetchMoneybird('/contacts.json'),
    ]);

    return { users, projects, contacts, error: null as string | null };
  } catch (error) {
    console.error('Error fetching data:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { users: [], projects: [], contacts: [], error: message };
  }
}

export async function getActiveEntry(userId: string) {
    try {
        console.log(`[getActiveEntry] Fetching for userId: ${userId}`);
        const allEntries = await fetchMoneybird(`/time_entries.json?filter=user_id:${userId},state:all,include_active:true`, { cache: 'no-store' });
        console.log(`[getActiveEntry] Response for ${userId}:`, typeof allEntries === 'object' ? 'received array/object' : allEntries);
        
        if (Array.isArray(allEntries)) {
          const active = (allEntries as TimeEntry[]).find((e) => e.user_id == userId && !e.ended_at);
          return active || null;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null; // Assume none
    }
}

export async function clockIn(userId: string, description: string, projectId: string | null, contactId: string | null) {
  const body = {
    time_entry: {
      user_id: userId,
      description,
      project_id: projectId,
      contact_id: contactId,
      // Subtract 15 seconds (15000ms) to account for clock skew/latency and avoid 'future date' errors
      started_at: new Date(Date.now() - 15000).toISOString(),
    },
  };

  return fetchMoneybird('/time_entries.json', {
    method: 'POST',
    body: JSON.stringify(body),
  }, REQUEST_TOKEN);
}

export async function clockOut(entryId: string) {
    // To clock out, we update the entry with ended_at
    const body = {
        time_entry: {
            ended_at: new Date().toISOString(),
        }
    };
    
    return fetchMoneybird(`/time_entries/${entryId}.json`, {
        method: 'PATCH',
        body: JSON.stringify(body)
    }, REQUEST_TOKEN);
}

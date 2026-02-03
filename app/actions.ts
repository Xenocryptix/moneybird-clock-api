'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BASE_URL = 'https://moneybird.com/api/v2';
const ADMINISTRATION_ID = process.env.ADMINISTRATION_ID;

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
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  redirect('/');
}

async function fetchMoneybird(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
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

    return { users, projects, contacts };
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

export async function getActiveEntry(userId: string) {
    try {
        console.log(`[getActiveEntry] Fetching for userId: ${userId}`);
        const allEntries = await fetchMoneybird(`/time_entries.json?filter=user_id:${userId},state:all,include_active:true`, { cache: 'no-store' });
        console.log(`[getActiveEntry] Response for ${userId}:`, typeof allEntries === 'object' ? 'received array/object' : allEntries);
        
        if (Array.isArray(allEntries)) {
           const active = allEntries.find((e: any) => e.user_id == userId && !e.ended_at);
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
  });
}

export async function clockOut(entryId: string, userId: string) {
    // To clock out, we update the entry with ended_at
    const body = {
        time_entry: {
            ended_at: new Date().toISOString(),
        }
    };
    
    return fetchMoneybird(`/time_entries/${entryId}.json`, {
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

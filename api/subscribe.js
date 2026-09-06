import { kv } from '@vercel/kv';

export const config = { runtime: 'edge' };

const KEY = 'notify:emails';

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.trim().length <= 254;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const email = (body && typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
  if (!isEmail(email)) {
    return new Response(JSON.stringify({ error: 'A valid email is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const createdAt = new Date().toISOString();
  try {
    const current = (await kv.get(KEY)) || [];
    if (!Array.isArray(current)) {
      throw new Error('existing value is corrupt');
    }
    const existing = current.find((entry) => entry && entry.email === email);
    if (existing) {
      return new Response(JSON.stringify({ ok: true, existing: true, createdAt: existing.createdAt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    const updated = [...current, { email, createdAt }];
    await kv.set(KEY, updated);
    return new Response(JSON.stringify({ ok: true, existing: false, createdAt }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (error) {
    console.error('subscribe:', error);
    return new Response(JSON.stringify({ error: 'Could not save your email. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}

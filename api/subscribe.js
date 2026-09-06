import { put, get, head } from '@vercel/blob';

const EMAIL_PATH = 'emails.json';

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

  try {
    let existing = [];
    try {
      const blob = await head(EMAIL_PATH, { access: 'private' });
      if (blob) {
        const response = await get(EMAIL_PATH, { access: 'private' });
        const raw = await response.text();
        if (raw.trim()) existing = JSON.parse(raw);
        if (!Array.isArray(existing)) existing = [];
      }
    } catch (error) {
      if (error && error.code !== 'BLOB_NOT_FOUND' && !String(error?.message || '').toLowerCase().includes('not found')) {
        throw error;
      }
      existing = [];
    }

    const createdAt = new Date().toISOString();
    const duplicate = existing.find((entry) => entry && entry.email === email);
    if (duplicate) {
      return new Response(JSON.stringify({ ok: true, existing: true, createdAt: duplicate.createdAt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const updated = [...existing, { email, createdAt }];
    const json = JSON.stringify(updated);
    await put(EMAIL_PATH, json, { access: 'private', contentType: 'application/json; charset=utf-8' });

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
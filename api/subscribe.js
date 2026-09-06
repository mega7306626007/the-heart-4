import { put, head, BlobNotFoundError } from '@vercel/blob';

const EMAIL_PATH = 'emails.json';

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.trim().length <= 254;
}

async function readEmails() {
  try {
    const blob = await head(EMAIL_PATH, { access: 'public' });
    if (!blob) return [];
    const response = await fetch(blob.url);
    if (!response.ok) return [];
    const raw = await response.text();
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error instanceof BlobNotFoundError) return [];
    throw error;
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
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
    const existing = await readEmails();
    const createdAt = new Date().toISOString();
    const duplicate = existing.find((entry) => entry && entry.email === email);
    if (duplicate) {
      return new Response(JSON.stringify({ ok: true, existing: true, createdAt: duplicate.createdAt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const updated = [...existing, { email, createdAt }];
    await put(EMAIL_PATH, JSON.stringify(updated), {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      addRandomSuffix: false,
    });

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
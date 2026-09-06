import { put, head, BlobNotFoundError } from '@vercel/blob';

const EMAIL_PATH = 'emails.json';

async function sendWelcomeEmail(to) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM;
  if (!apiKey || !from) return;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "You're on the list for The Heart",
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#EFE6D3;font-family:Georgia,'Times New Roman',serif;color:#1B1B1B;">
<div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid rgba(27,27,27,0.12);border-radius:6px;padding:2.5rem 2rem;">
  <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:2rem;margin:0 0 1rem;color:#1B1B1B;">The Heart</h1>
  <p style="line-height:1.7;margin:0 0 1.2rem;">You're on the list. The moment <em>The Heart</em> is ready — printed or PDF — you'll hear from me first.</p>
  <p style="line-height:1.7;margin:0 0 1.2rem;">In the meantime, the poems are always growing at <a href="https://the-heart-4.vercel.app" style="color:#2F6F62;text-decoration:underline;">the-heart-4.vercel.app</a>.</p>
  <hr style="border:none;border-top:1px solid rgba(27,27,27,0.1);margin:1.5rem 0;">
  <p style="font-size:0.85rem;opacity:0.65;margin:0;">Emmanuel Mwendwa — Mweshimiwa / Mwesh</p>
</div>
</body>
</html>`,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('welcome email rejected by Resend:', res.status, detail);
  }
}

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.trim().length <= 254;
}

async function readEmails() {
  try {
    const blob = await head(EMAIL_PATH, { access: 'public' });
    if (!blob) return [];
    const response = await fetch(blob.url, { cache: 'no-store' });
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

    await sendWelcomeEmail(email).catch((err) => console.error('welcome email failed:', err));

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
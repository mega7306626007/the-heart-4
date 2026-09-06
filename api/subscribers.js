import { head, put, BlobNotFoundError } from '@vercel/blob';

const EMAIL_PATH = 'emails.json';

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
    console.error('subscribers:', error);
    return [];
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('key');
  const expected = process.env.SUBSCRIBERS_KEY;
  if (!expected || token !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  const emails = await readEmails();

  const deleteEmail = url.searchParams.get('delete');
  if (deleteEmail) {
    const remaining = emails.filter((e) => e.email !== deleteEmail);
    await put(EMAIL_PATH, JSON.stringify(remaining), {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      addRandomSuffix: false,
    });
    const next = new URL(request.url);
    next.searchParams.delete('delete');
    return Response.redirect(next.toString(), 303);
  }

  const sort = url.searchParams.get('sort');
  const sorted = [...emails].sort((a, b) =>
    sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)
  );

  const csv = ['email,subscribed_at', ...sorted.map((e) => `${e.email},${e.createdAt}`)].join('\r\n');

  if (url.searchParams.get('format') === 'csv') {
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="mwesh-subscribers.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

  const rows = sorted
    .map(
      (e) =>
        `<tr><td class="addr">${escapeHtml(e.email)}</td><td>${escapeHtml(
          new Date(e.createdAt).toLocaleString()
        )}</td><td><a class="del" href="?key=${encodeURIComponent(
          expected
        )}&delete=${encodeURIComponent(e.email)}" onclick="return confirm('Remove ${escapeHtml(e.email)}?')">remove</a></td></tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>The Heart — Notify list</title>
<style>
  body{margin:0;font-family:Georgia,'Times New Roman',serif;background:#EFE6D3;color:#1B1B1B;padding:3rem 1.5rem;}
  .wrap{max-width:760px;margin:0 auto;background:#fff;border:1px solid rgba(27,27,27,0.12);border-radius:6px;padding:2rem;}
  h1{font-size:2rem;margin:0 0 0.2rem;}
  .count{opacity:0.7;margin-bottom:1.5rem;}
  table{width:100%;border-collapse:collapse;}
  th,td{text-align:left;padding:0.6rem 0.5rem;border-bottom:1px solid rgba(27,27,27,0.1);font-size:0.95rem;}
  th{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;opacity:0.6;}
  td.addr{font-weight:600;}
  .del{color:#E0764B;text-decoration:none;font-size:0.85rem;}
  .actions{display:flex;gap:1rem;margin-top:1.5rem;flex-wrap:wrap;}
  .actions a, .actions button{font:inherit;padding:0.6rem 1rem;border-radius:4px;text-decoration:none;color:#fff;background:#2F6F62;border:none;cursor:pointer;}
  .empty{opacity:0.6;font-style:italic;}
</style>
</head>
<body>
<div class="wrap">
  <h1>The Heart — Notify list</h1>
  <p class="count">${emails.length} signup${emails.length === 1 ? '' : 's'} · newest first</p>
  ${emails.length ? `<table>
    <thead><tr><th>Email</th><th>Subscribed</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>` : `<p class="empty">No signups yet.</p>`}
  <div class="actions">
    <a href="?key=${encodeURIComponent(expected)}&format=csv">Download CSV</a>
    <a href="?key=${encodeURIComponent(expected)}&sort=oldest">Oldest first</a>
    <a href="?key=${encodeURIComponent(expected)}">Newest first</a>
  </div>
</div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
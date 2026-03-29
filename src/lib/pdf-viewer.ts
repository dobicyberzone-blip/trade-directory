/**
 * Utility function to open PDFs and documents in a new tab
 */

const RUSTFS_ENDPOINT = process.env.NEXT_PUBLIC_RUSTFS_ENDPOINT || 'http://161.97.178.128:9101';
const RUSTFS_BUCKET = process.env.NEXT_PUBLIC_RUSTFS_BUCKET || 'trade-directory';

export function resolveFileUrl(url: string): string {
  if (!url) return url;

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  if (url.startsWith('/uploads/')) {
    url = `/api/files${url}`;
  }

  if (typeof window !== 'undefined' && url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }

  return url;
}

function extractKey(url: string): string | null {
  const match = url.match(/\/api\/files\/(.+)/) || url.match(/\/uploads\/(.+)/);
  return match ? match[1] : null;
}

function writeLoading(win: Window, title: string) {
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f9fafb;}
    .spinner{width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#16a34a;border-radius:50%;animation:spin 0.8s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}</style></head>
    <body><div class="spinner"></div></body></html>`);
  win.document.close();
}

function writeUnavailable(win: Window, title: string) {
  win.document.open();
  win.document.write(`<!DOCTYPE html><html><head><title>${title} - Unavailable</title>
    <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f9fafb;}
    .card{background:white;border-radius:12px;padding:40px;text-align:center;box-shadow:0 4px 6px rgba(0,0,0,.07);max-width:400px;}
    h2{color:#111827;margin:0 0 8px;}p{color:#6b7280;margin:0 0 16px;}.icon{font-size:48px;margin-bottom:16px;}
    a{color:#16a34a;text-decoration:none;font-weight:500;}</style></head>
    <body><div class="card"><div class="icon">📄</div><h2>File Unavailable</h2>
    <p><strong>${title}</strong> was stored on the previous server and is no longer available.</p>
    <p>Please re-upload this document from your business profile.</p>
    <a href="javascript:window.close()">Close this tab</a></div></body></html>`);
  win.document.close();
}

export function openPdfInNewWindow(url: string, title: string = 'Document') {
  const resolvedUrl = resolveFileUrl(url);

  // data: URLs — write inline
  if (resolvedUrl.startsWith('data:')) {
    const win = window.open('', '_blank');
    if (!win) return;
    const isImage = resolvedUrl.startsWith('data:image/');
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>body{margin:0;background:#1a1a1a;display:flex;justify-content:center;}
      img{max-width:100%;height:auto;}embed{width:100%;height:100vh;}</style></head>
      <body>${isImage ? `<img src="${resolvedUrl}" alt="${title}"/>` : `<embed src="${resolvedUrl}" type="application/pdf"/>`}</body></html>`);
    win.document.close();
    return;
  }

  // Open window immediately (must be synchronous to avoid popup blocker)
  const win = window.open('', '_blank');
  if (!win) return;

  // For local /api/files/ paths — check availability then navigate
  if (resolvedUrl.includes('/api/files/')) {
    writeLoading(win, title);

    fetch(resolvedUrl, { method: 'HEAD' })
      .then(res => {
        if (res.ok) {
          win.location.href = resolvedUrl;
          return;
        }
        // Try RustFS fallback
        const key = extractKey(url);
        if (key) {
          const rustfsUrl = `${RUSTFS_ENDPOINT}/${RUSTFS_BUCKET}/${key}`;
          return fetch(rustfsUrl, { method: 'HEAD' }).then(r2 => {
            if (r2.ok) {
              win.location.href = rustfsUrl;
            } else {
              writeUnavailable(win, title);
            }
          });
        }
        writeUnavailable(win, title);
      })
      .catch(() => {
        // On network error just try to navigate directly
        win.location.href = resolvedUrl;
      });
    return;
  }

  // Direct URL (RustFS, external) — navigate immediately
  win.location.href = resolvedUrl;
}

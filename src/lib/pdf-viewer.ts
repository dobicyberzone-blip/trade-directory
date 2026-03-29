/**
 * Utility function to open PDFs and documents in a new tab
 */

const RUSTFS_ENDPOINT = process.env.NEXT_PUBLIC_RUSTFS_ENDPOINT || 'http://161.97.178.128:9101';
const RUSTFS_BUCKET = process.env.NEXT_PUBLIC_RUSTFS_BUCKET || 'trade-directory';

export function resolveFileUrl(url: string): string {
  if (!url) return url;

  // Already absolute (RustFS, external, or data URL)
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // Legacy /uploads/ path → rewrite to /api/files/
  if (url.startsWith('/uploads/')) {
    url = `/api/files${url}`;
  }

  // Make relative /api/files/ paths absolute using current origin
  if (typeof window !== 'undefined' && url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }

  return url;
}

/**
 * Extract the filename/key from a URL for RustFS lookup
 */
function extractKey(url: string): string | null {
  try {
    // /api/files/business-documents/filename.pdf → business-documents/filename.pdf
    const match = url.match(/\/api\/files\/(.+)/);
    if (match) return match[1];
    // /uploads/business-documents/filename.pdf → business-documents/filename.pdf
    const match2 = url.match(/\/uploads\/(.+)/);
    if (match2) return match2[1];
    return null;
  } catch {
    return null;
  }
}

export async function openPdfInNewWindow(url: string, title: string = 'Document') {
  const resolvedUrl = resolveFileUrl(url);

  // For data URLs (base64), write an HTML page with an img/embed tag
  if (resolvedUrl.startsWith('data:')) {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      const isImage = resolvedUrl.startsWith('data:image/');
      newWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="UTF-8">
    <style>
      body { margin: 0; background: #1a1a1a; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; }
      img, embed { max-width: 100%; height: auto; display: block; }
      embed { width: 100%; height: 100vh; }
    </style>
  </head>
  <body>
    ${isImage
      ? `<img src="${resolvedUrl}" alt="${title}" />`
      : `<embed src="${resolvedUrl}" type="application/pdf" />`
    }
  </body>
</html>`);
      newWindow.document.close();
    }
    return;
  }

  // For local /api/files/ URLs — check if file exists, fallback to RustFS
  if (resolvedUrl.includes('/api/files/')) {
    try {
      const res = await fetch(resolvedUrl, { method: 'HEAD' });
      if (res.ok) {
        window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      // File not found locally — try RustFS
      const key = extractKey(url);
      if (key) {
        const rustfsUrl = `${RUSTFS_ENDPOINT}/${RUSTFS_BUCKET}/${key}`;
        const rustfsRes = await fetch(rustfsUrl, { method: 'HEAD' });
        if (rustfsRes.ok) {
          window.open(rustfsUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      }
      // Neither found — show friendly message
      showFileUnavailable(title);
      return;
    } catch {
      // Network error — try opening directly
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
      return;
    }
  }

  // For all other URLs (RustFS direct, external), open directly
  window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
}

function showFileUnavailable(title: string) {
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${title} - Unavailable</title>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb; }
      .card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.07); max-width: 400px; }
      h2 { color: #111827; margin: 0 0 8px; }
      p { color: #6b7280; margin: 0 0 24px; }
      .icon { font-size: 48px; margin-bottom: 16px; }
      a { color: #16a34a; text-decoration: none; font-weight: 500; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">📄</div>
      <h2>File Unavailable</h2>
      <p><strong>${title}</strong> was stored on the previous server and is no longer available.</p>
      <p>Please re-upload this document from your business profile.</p>
      <a href="javascript:window.close()">Close this tab</a>
    </div>
  </body>
</html>`);
    newWindow.document.close();
  }
}

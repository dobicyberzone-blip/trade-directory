/**
 * Utility function to open PDFs and documents in a new tab
 */

export function resolveFileUrl(url: string): string {
  if (!url) return url;

  // Already absolute
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

export function openPdfInNewWindow(url: string, title: string = 'Document') {
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

  // For all other URLs (local files, external), open directly in a new tab
  window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Utility function to open PDFs and documents in a new tab
 */

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

  // Direct URL — navigate immediately
  window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
}

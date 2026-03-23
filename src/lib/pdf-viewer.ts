/**
 * Utility function to open PDFs with proper loading indicator
 * Prevents blank page issues by showing a loading spinner while PDF loads
 */

function resolveFileUrl(url: string): string {
  if (!url) return url;
  // Rewrite legacy /uploads/ paths to go through the API file server
  if (url.startsWith('/uploads/')) {
    return `/api/files${url}`;
  }
  return url;
}

export function openPdfInNewWindow(url: string, title: string = 'Document') {
  const resolvedUrl = resolveFileUrl(url);
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
              font-family: Arial, sans-serif;
            }
            iframe {
              width: 100%;
              height: 100vh;
              border: none;
            }
            .loading {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              text-align: center;
              color: #666;
            }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 10px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Loading PDF...</p>
          </div>
          <iframe id="pdfFrame" src="${resolvedUrl}" onload="document.getElementById('loading').style.display='none'"></iframe>
        </body>
      </html>
    `);
    newWindow.document.close();
  }
}

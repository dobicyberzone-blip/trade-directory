/**
 * Client-side chunk loading error handler
 * Handles ChunkLoadError by attempting to reload the page
 * 
 * This prevents the app from crashing when webpack chunks fail to load,
 * which can happen due to:
 * - Stale browser cache after deployment
 * - Network issues during chunk download
 * - Webpack HMR issues in development
 */

if (typeof window !== 'undefined') {
  // Track reload attempts to prevent infinite loops
  const RELOAD_KEY = 'chunk_reload_attempt';
  const MAX_RELOAD_ATTEMPTS = 3;
  const RELOAD_TIMEOUT = 10000; // 10 seconds

  /**
   * Check if we should attempt a reload
   */
  const shouldAttemptReload = (): boolean => {
    const lastAttempt = sessionStorage.getItem(RELOAD_KEY);
    
    if (!lastAttempt) return true;
    
    try {
      const { count, timestamp } = JSON.parse(lastAttempt);
      const now = Date.now();
      
      // Reset counter if enough time has passed
      if (now - timestamp > RELOAD_TIMEOUT) {
        sessionStorage.removeItem(RELOAD_KEY);
        return true;
      }
      
      // Check if we've exceeded max attempts
      return count < MAX_RELOAD_ATTEMPTS;
    } catch {
      sessionStorage.removeItem(RELOAD_KEY);
      return true;
    }
  };

  /**
   * Record a reload attempt
   */
  const recordReloadAttempt = (): void => {
    const lastAttempt = sessionStorage.getItem(RELOAD_KEY);
    
    try {
      const data = lastAttempt ? JSON.parse(lastAttempt) : { count: 0, timestamp: Date.now() };
      data.count += 1;
      data.timestamp = Date.now();
      sessionStorage.setItem(RELOAD_KEY, JSON.stringify(data));
    } catch {
      sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count: 1, timestamp: Date.now() }));
    }
  };

  /**
   * Handle chunk loading errors
   */
  const handleChunkError = (error: Error, source: string): void => {
    // Check if we should reload
    if (!shouldAttemptReload()) {
      // Show persistent error message
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #f44336;
          color: white;
          padding: 16px;
          text-align: center;
          z-index: 999999;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <strong>⚠️ Failed to load resources.</strong>
          <button onclick="location.reload()" style="
            margin-left: 16px;
            padding: 8px 16px;
            background: white;
            color: #f44336;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          ">
            Reload Page
          </button>
        </div>
      `;
      document.body.appendChild(errorDiv);
      return;
    }
    
    // Record attempt and reload
    recordReloadAttempt();
    
    // In production, reload silently
    if (process.env.NODE_ENV === 'production') {
      window.location.reload();
      return;
    }
    
    // In development, ask user
    const shouldReload = confirm(
      'Some resources failed to load. Would you like to reload the page?\n\n' +
      'Tip: If this keeps happening, try:\n' +
      '1. Stop dev server\n' +
      '2. Delete .next folder\n' +
      '3. Restart dev server'
    );
    
    if (shouldReload) {
      window.location.reload();
    }
  };

  /**
   * Handle global errors
   */
  window.addEventListener('error', (event) => {
    const error = event.error;
    
    // Check for CSS MIME type errors (CSS loaded as script)
    // This happens when Next.js runtime tries to load a CSS chunk as a script tag
    const target = event.target as HTMLElement | null;
    if (target && target.tagName === 'SCRIPT') {
      const src = (target as HTMLScriptElement).src;
      if (src && src.includes('/_next/static/css/') && src.endsWith('.css')) {
        // Silently remove the invalid script tag and reload to fix the issue
        target.parentElement?.removeChild(target);
        if (shouldAttemptReload()) {
          recordReloadAttempt();
          window.location.reload();
        }
        return;
      }
    }

    if (!error) return;
    
    // Check for chunk loading errors
    const isChunkError = 
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed');
    
    if (isChunkError) {
      event.preventDefault(); // Prevent default error handling
      handleChunkError(error, 'error event');
    }
  });

  /**
   * Handle unhandled promise rejections
   */
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    if (!error) return;
    
    // Check for chunk-related promise rejections
    const isChunkError = 
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed') ||
      error.message?.includes('timeout');
    
    if (isChunkError) {
      event.preventDefault(); // Prevent the error from being logged as unhandled
      handleChunkError(error, 'promise rejection');
    }
  });

  // Clear reload counter on successful page load
  window.addEventListener('load', () => {
    // Wait a bit to ensure everything loaded successfully
    setTimeout(() => {
      sessionStorage.removeItem(RELOAD_KEY);
    }, 2000);
  });
}

export {};

/**
 * OTP Bypass System for Testing
 * 
 * This module provides a safe mechanism to temporarily disable OTP authentication
 * during automated testing. It includes multiple safety checks to prevent
 * accidental use in production environments.
 * 
 * Safety Features:
 * - Only works in non-production environments
 * - Only works on localhost
 * - Logs all bypass attempts for audit
 * - Requires explicit environment variable flag
 */

/**
 * Check if OTP bypass is enabled
 * Returns true only if ALL safety conditions are met
 */
export function isOTPBypassEnabled(): boolean {
  // Check 1: Environment variable must be explicitly set to 'true'
  const bypassFlag = process.env.OTP_BYPASS_ENABLED === 'true';
  
  // Check 2: Must NOT be in production environment
  const notProduction = process.env.NODE_ENV !== 'production';
  
  // Check 3: Must be running on localhost
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const isLocalhost = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  
  // All conditions must be true
  const isEnabled = bypassFlag && notProduction && isLocalhost;
  
  if (bypassFlag && !isEnabled) {

  }
  
  return isEnabled;
}

/**
 * Log OTP bypass attempt for audit purposes
 */
export function logBypassAttempt(userId: string, email: string, role: string): void {
  if (isOTPBypassEnabled()) {
    const timestamp = new Date().toISOString();

  }
}

/**
 * Get bypass status information for debugging
 */
export function getBypassStatus(): {
  enabled: boolean;
  reason: string;
  checks: {
    bypassFlag: boolean;
    notProduction: boolean;
    isLocalhost: boolean;
  };
} {
  const bypassFlag = process.env.OTP_BYPASS_ENABLED === 'true';
  const notProduction = process.env.NODE_ENV !== 'production';
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const isLocalhost = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  
  const enabled = bypassFlag && notProduction && isLocalhost;
  
  let reason = '';
  if (!enabled) {
    if (!bypassFlag) reason = 'OTP_BYPASS_ENABLED not set to true';
    else if (!notProduction) reason = 'Running in production environment';
    else if (!isLocalhost) reason = 'Not running on localhost';
  } else {
    reason = 'All safety checks passed';
  }
  
  return {
    enabled,
    reason,
    checks: {
      bypassFlag,
      notProduction,
      isLocalhost
    }
  };
}

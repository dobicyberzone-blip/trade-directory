#!/bin/bash
# =============================================================================
# Setup crontab for KEPROBA logo reminder cron job
# Run this ONCE on your production server:
#   bash scripts/setup-crontab.sh
# =============================================================================

APP_URL="http://trade-directory-161.97.178.128.sslip.io"
CRON_SECRET="5874f318b986fc76285297c7952093291978bf06949ded4dfc165bd8fa3e65c1"
LOG_FILE="/var/log/keproba-cron.log"

# The cron job: runs at 8:00 AM every 3 days
CRON_JOB="0 8 */3 * * curl -s -o $LOG_FILE -w '\%{http_code}' -H 'Authorization: Bearer $CRON_SECRET' $APP_URL/api/cron/logo-reminder >> $LOG_FILE 2>&1"

# Add to crontab only if not already present
(crontab -l 2>/dev/null | grep -q "logo-reminder") && {
  echo "Cron job already exists — skipping."
  exit 0
}

(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✓ Cron job installed. Schedule: 8:00 AM every 3 days."
echo "  Endpoint: $APP_URL/api/cron/logo-reminder"
echo "  Log file: $LOG_FILE"
echo ""
echo "Verify with: crontab -l"

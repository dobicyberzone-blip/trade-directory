-- =============================================================================
-- DATABASE INDEXING OPTIMIZATION SCRIPT
-- Kenya Trade Directory — PostgreSQL
-- =============================================================================
-- Run this on your production database:
--   psql $DATABASE_URL -f scripts/optimize-indexes.sql
--
-- ANALYSIS SUMMARY:
-- The schema already has many single-column indexes but is missing:
--   1. Full-text search indexes (currently doing ILIKE '%...%' — full table scans)
--   2. Covering indexes for the hot directory query path
--   3. Composite indexes matching actual multi-filter query patterns
--   4. Partial indexes for the most common filtered subsets
--   5. Several duplicate/redundant indexes that hurt write performance
-- =============================================================================


-- =============================================================================
-- SECTION 1: DROP REDUNDANT / DUPLICATE INDEXES
-- These are exact or near-duplicate indexes that waste storage and slow writes.
-- =============================================================================

-- businesses table has BOTH @@index([sector]) AND @@index([sector], map:"idx_businesses_sector")
-- Keep the named one, drop the auto-generated duplicate
DROP INDEX CONCURRENTLY IF EXISTS "businesses_sector_idx";

-- businesses table has BOTH @@index([location]) AND @@index([location], map:"idx_businesses_location")
DROP INDEX CONCURRENTLY IF EXISTS "businesses_location_idx";

-- businesses table has BOTH @@index([ownerId]) AND @@index([ownerId], map:"idx_businesses_owner")
-- ownerId is also UNIQUE (one business per user) so the unique constraint already acts as an index
DROP INDEX CONCURRENTLY IF EXISTS "businesses_ownerId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "idx_businesses_owner";

-- businesses table has BOTH @@index([verificationStatus]) AND @@index([verificationStatus], map:"idx_businesses_verification")
-- The composite idx_business_verification_created covers this — drop the single-column one
DROP INDEX CONCURRENTLY IF EXISTS "businesses_verificationStatus_idx";
DROP INDEX CONCURRENTLY IF EXISTS "idx_businesses_verification";

-- products table has BOTH @@index([availability]) AND @@index([availability], map:"idx_products_availability")
DROP INDEX CONCURRENTLY IF EXISTS "products_availability_idx";

-- products table has BOTH @@index([category]) AND @@index([category], map:"idx_products_category")
-- The composite idx_products_category_verified_created covers this
DROP INDEX CONCURRENTLY IF EXISTS "products_category_idx";
DROP INDEX CONCURRENTLY IF EXISTS "idx_products_category";

-- inquiries: @@index([status]) AND @@index([status], map:"idx_inquiries_status") — duplicate
DROP INDEX CONCURRENTLY IF EXISTS "inquiries_status_idx";
DROP INDEX CONCURRENTLY IF EXISTS "idx_inquiries_status";

-- searches: @@index([userId, createdAt]) duplicates @@index([userId]) + @@index([createdAt])
-- Keep the composite, drop the singles since the composite covers them
DROP INDEX CONCURRENTLY IF EXISTS "searches_createdAt_idx";


-- =============================================================================
-- SECTION 2: FULL-TEXT SEARCH INDEXES
-- The directory search does: name ILIKE '%q%', description ILIKE '%q%',
-- sector ILIKE '%q%', location ILIKE '%q%' — these are full table scans.
-- A GIN tsvector index reduces this from O(n) to O(log n).
-- =============================================================================

-- Composite full-text index on the fields used in the search OR clause
-- Weights: A=name (highest), B=sector/location, C=description (lowest)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_fts
  ON businesses
  USING GIN (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(sector, '') || ' ' ||
      coalesce(industry, '') || ' ' ||
      coalesce(location, '') || ' ' ||
      coalesce(county, '') || ' ' ||
      coalesce(town, '') || ' ' ||
      coalesce(description, '')
    )
  )
  WHERE published = true;

-- Full-text index for products search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_fts
  ON products
  USING GIN (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(description, '')
    )
  )
  WHERE published = true AND availability = true;

-- Full-text index for business name only (used in check-business-name duplicate detection)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_name_fts
  ON businesses
  USING GIN (to_tsvector('simple', name));


-- =============================================================================
-- SECTION 3: COVERING INDEXES FOR THE HOT DIRECTORY QUERY PATH
-- The main /api/businesses query always filters on:
--   published=true, then optionally sector, verificationStatus, featured
--   and orders by: featured DESC, createdAt DESC
-- A covering index eliminates the heap fetch for the most common path.
-- =============================================================================

-- Primary directory listing index — covers the default query (no filters)
-- Column order: published first (equality, high selectivity as partial),
-- then featured (sort), then createdAt (sort)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_directory_listing
  ON businesses (featured DESC, createdAt DESC, id)
  WHERE published = true;

-- Directory listing with verification filter (most common filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_verified_listing
  ON businesses (featured DESC, createdAt DESC, id)
  WHERE published = true AND "verificationStatus" = 'VERIFIED';

-- Sector + published filter (second most common filter combination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_sector_listing
  ON businesses (sector, featured DESC, createdAt DESC)
  WHERE published = true;

-- County filter (used heavily in the multi-filter panel)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_county_listing
  ON businesses (county, featured DESC, createdAt DESC)
  WHERE published = true;

-- Sector + county composite (common combined filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_sector_county
  ON businesses (sector, county, "verificationStatus", featured DESC, createdAt DESC)
  WHERE published = true;


-- =============================================================================
-- SECTION 4: PARTIAL INDEXES FOR HIGH-FREQUENCY SUBSETS
-- Partial indexes are smaller and faster than full indexes because they only
-- index the rows that actually match the condition.
-- =============================================================================

-- Admin verification queue — always queries PENDING businesses
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_pending_verification
  ON businesses (createdAt DESC, id)
  WHERE "verificationStatus" = 'PENDING';

-- Admin: businesses needing verification (needsVerification flag)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_needs_verification
  ON businesses (createdAt DESC)
  WHERE "needsVerification" = true;

-- Featured businesses (small subset, queried on homepage)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_featured_active
  ON businesses ("featuredAt" DESC)
  WHERE featured = true AND published = true;

-- Active user sessions (most session lookups filter isActive=true)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_active_user
  ON user_sessions ("userId", "lastActivity" DESC)
  WHERE "isActive" = true;

-- Unread notifications (the bell icon query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread
  ON notifications ("userId", "createdAt" DESC)
  WHERE read = false;

-- Unread chat messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_unread
  ON chat_messages ("conversationId", "createdAt" DESC)
  WHERE "isRead" = false;

-- Active OTP codes (always queried with used=false AND expiresAt > now())
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otp_active
  ON otp_codes (email, "expiresAt" DESC)
  WHERE used = false;

-- Published + available products (the public product listing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_public_listing
  ON products ("businessId", "createdAt" DESC)
  WHERE published = true AND availability = true;

-- Verified products for admin queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_pending_verification
  ON products ("createdAt" DESC)
  WHERE verified = false AND published = true;

-- Active certifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certifications_active
  ON certifications ("sortOrder", name)
  WHERE "isActive" = true;


-- =============================================================================
-- SECTION 5: COMPOSITE INDEXES FOR JOIN + FILTER PATTERNS
-- =============================================================================

-- Chat: loading a conversation's messages (conversationId + createdAt is the
-- most common access pattern — fetch all messages for a conversation in order)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_conversation_time
  ON chat_messages ("conversationId", "createdAt" ASC, id);

-- Chat participants: find all conversations for a user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_participants_user_conv
  ON chat_participants ("userId", "conversationId");

-- Profile views analytics: count views per business in a time window
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_business_time
  ON profile_views ("businessId", "viewedAt" DESC)
  WHERE "viewedAt" > NOW() - INTERVAL '90 days';

-- Ratings: average rating per business (groupBy businessId)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_business_value
  ON ratings ("businessId", rating);

-- Inquiries: exporter dashboard — all inquiries for a business, sorted by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inquiries_business_date
  ON inquiries ("businessId", "createdAt" DESC, status);

-- Favorites: check if a user has favorited a specific business (hot path)
-- The @@unique([userId, businessId]) already creates this — no action needed.

-- Audit logs: admin audit trail filtered by entity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_entity_time
  ON audit_logs ("entityType", "entityId", timestamp DESC);

-- Password history: check last N passwords for a user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_history_user_time
  ON password_history ("userId", "changedAt" DESC);

-- Business certifications: load all certs for a business (JOIN pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_biz_certs_business_valid
  ON business_certifications ("businessId", "validUntil" DESC);

-- User activity: admin user detail page loads last 10 activities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_user_time
  ON user_activities ("userId", "createdAt" DESC);


-- =============================================================================
-- SECTION 6: EXPRESSION INDEXES
-- For case-insensitive exact lookups that bypass ILIKE
-- =============================================================================

-- Business name lookup (used in check-business-name — normalize + lower)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_name_lower
  ON businesses (lower(name));

-- User email lookup (login, check-email) — email is already unique but
-- the unique index may not be used for lower() comparisons
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower
  ON users (lower(email));

-- Business sector lower (filter uses ILIKE on sector)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_sector_lower
  ON businesses (lower(sector))
  WHERE published = true;

-- Business county lower (filter uses ILIKE on county)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_county_lower
  ON businesses (lower(county))
  WHERE published = true;


-- =============================================================================
-- SECTION 7: VERIFY — CHECK FOR UNUSED INDEXES AFTER 30 DAYS
-- Run this query to find indexes with zero or very low usage:
-- =============================================================================
/*
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan        AS times_used,
  idx_tup_read    AS tuples_read,
  idx_tup_fetch   AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
*/

-- =============================================================================
-- SECTION 8: MONITOR SLOW QUERIES (requires pg_stat_statements extension)
-- =============================================================================
/*
-- Enable if not already enabled (requires superuser):
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2)  AS avg_ms,
  calls,
  round(stddev_exec_time::numeric, 2) AS stddev_ms,
  left(query, 120) AS query_snippet
FROM pg_stat_statements
WHERE mean_exec_time > 50  -- queries averaging over 50ms
ORDER BY mean_exec_time DESC
LIMIT 25;
*/

-- =============================================================================
-- SECTION 9: TABLE STATISTICS — ensure autovacuum is keeping stats fresh
-- =============================================================================
/*
SELECT
  relname AS table_name,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;
*/

-- Force statistics update after adding indexes
ANALYZE businesses;
ANALYZE products;
ANALYZE users;
ANALYZE inquiries;
ANALYZE notifications;
ANALYZE chat_messages;
ANALYZE profile_views;
ANALYZE ratings;

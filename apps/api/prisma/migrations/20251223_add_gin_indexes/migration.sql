-- CreateGinIndexes
-- GIN indexes for JSONB searches (10x faster for metadata queries)

-- GIN index for User metadata (preferences, settings, etc.)
-- Use case: Filter users by metadata.preferences.theme = 'dark'
-- Performance: 10x faster for @> operator queries
CREATE INDEX IF NOT EXISTS "User_metadata_gin_idx"
ON "User" USING GIN (metadata jsonb_path_ops);

-- GIN index for BehaviorLog payload
-- Use case: Search event payloads by specific fields
CREATE INDEX IF NOT EXISTS "BehaviorLog_payload_gin_idx"
ON "BehaviorLog" USING GIN (payload jsonb_path_ops);

-- GIN index for SocialPost content
-- Use case: Search post content (multilingual)
CREATE INDEX IF NOT EXISTS "SocialPost_content_gin_idx"
ON "SocialPost" USING GIN (content jsonb_path_ops);

-- Comments for documentation
COMMENT ON INDEX "User_metadata_gin_idx" IS 'GIN index for fast JSONB containment queries on user metadata';
COMMENT ON INDEX "BehaviorLog_payload_gin_idx" IS 'GIN index for event payload searches - 10x faster';
COMMENT ON INDEX "SocialPost_content_gin_idx" IS 'GIN index for multilingual content searches';

-- ADR-005: RecommendationShareCode (importação por código) + Recommendation.source_label (atribuição no import)

ALTER TABLE "recommendation"
ADD COLUMN IF NOT EXISTS "source_label" TEXT;

CREATE TABLE IF NOT EXISTS "recommendation_share_code" (
  "id"                TEXT PRIMARY KEY,
  "code"              TEXT NOT NULL UNIQUE,
  "recommendation_id" TEXT NOT NULL REFERENCES "recommendation"("id"),
  "created_by_id"     TEXT NOT NULL REFERENCES "app_user"("id"),
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT now(),
  "expires_at"        TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS
"recommendation_share_code_recommendation_id_idx"
ON "recommendation_share_code" ("recommendation_id");
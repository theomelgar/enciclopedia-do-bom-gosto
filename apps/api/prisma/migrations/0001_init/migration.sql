-- Migration inicial — espelha prisma/schema.prisma + DATABASE_SPEC.md (extensões, índices, triggers, RLS).
-- Escrita manualmente: Prisma Migrate não gera CREATE EXTENSION / triggers / RLS sozinho.

-- ========== Extensões (DATABASE_SPEC.md §Extensões) ==========
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ========== Tabelas ==========
CREATE TABLE "space" (
  "id"   TEXT PRIMARY KEY,
  "name" TEXT NOT NULL
);

CREATE TABLE "app_user" (
  "id"    TEXT PRIMARY KEY,
  "name"  TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE
);

CREATE TYPE "SpaceRole" AS ENUM ('OWNER', 'MEMBER');
CREATE TABLE "space_member" (
  "id"       TEXT PRIMARY KEY,
  "space_id" TEXT NOT NULL REFERENCES "space"("id"),
  "user_id"  TEXT NOT NULL REFERENCES "app_user"("id"),
  "role"     "SpaceRole" NOT NULL DEFAULT 'MEMBER',
  UNIQUE ("space_id", "user_id")
);

CREATE TABLE "place_category" (
  "id"   TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "icon" TEXT
);

CREATE TABLE "place" (
  "id"              TEXT PRIMARY KEY,
  "space_id"        TEXT NOT NULL REFERENCES "space"("id"),
  "name"            TEXT NOT NULL,
  "category_id"     TEXT REFERENCES "place_category"("id"),
  "address"         TEXT,
  "neighborhood"    TEXT,
  "city"            TEXT,
  "state"           TEXT,
  "zip_code"        TEXT,
  "latitude"        DOUBLE PRECISION,
  "longitude"       DOUBLE PRECISION,
  "geom"            geography(Point, 4326),
  "phone"           TEXT,
  "whatsapp"        TEXT,
  "instagram"       TEXT,
  "website"         TEXT,
  "opening_hours"   JSONB,
  "notes"           TEXT,
  "created_by_id"   TEXT NOT NULL REFERENCES "app_user"("id"),
  "updated_by_id"   TEXT NOT NULL REFERENCES "app_user"("id"),
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE TABLE "brand" (
  "id"       TEXT PRIMARY KEY,
  "space_id" TEXT NOT NULL REFERENCES "space"("id"),
  "name"     TEXT NOT NULL,
  "logo_url" TEXT,
  "website"  TEXT,
  UNIQUE ("space_id", "name")
);

CREATE TABLE "recommendation_category" (
  "id"   TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "icon" TEXT
);

CREATE TYPE "Verdict" AS ENUM ('RECOMMEND', 'EMERGENCY_ONLY', 'NOT_RECOMMEND');
CREATE TYPE "RecommendationStatus" AS ENUM ('WANT_TO_TRY', 'EXPERIENCED', 'DISCARDED');

CREATE TABLE "recommendation" (
  "id"                    TEXT PRIMARY KEY,
  "space_id"              TEXT NOT NULL REFERENCES "space"("id"),
  "name"                  TEXT NOT NULL,
  "description"           TEXT,
  "category_id"           TEXT REFERENCES "recommendation_category"("id"),
  "brand_id"              TEXT REFERENCES "brand"("id"),
  "status"                "RecommendationStatus" NOT NULL DEFAULT 'EXPERIENCED',
  "verdict"               "Verdict",
  "rating"                NUMERIC(2, 1),
  "first_experienced_at"  TIMESTAMP(3),
  "last_experienced_at"   TIMESTAMP(3),
  "search_vector"         tsvector,
  "created_by_id"         TEXT NOT NULL REFERENCES "app_user"("id"),
  "updated_by_id"         TEXT NOT NULL REFERENCES "app_user"("id"),
  "created_at"            TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updated_at"            TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE TABLE "recommendation_place" (
  "id"                TEXT PRIMARY KEY,
  "recommendation_id" TEXT NOT NULL REFERENCES "recommendation"("id"),
  "place_id"          TEXT NOT NULL REFERENCES "place"("id"),
  "last_price"        MONEY,
  "notes"             TEXT,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT now(),
  UNIQUE ("recommendation_id", "place_id")
);

CREATE TABLE "price_entry" (
  "id"                       TEXT PRIMARY KEY,
  "recommendation_place_id"  TEXT NOT NULL REFERENCES "recommendation_place"("id"),
  "price"                    MONEY NOT NULL,
  "paid_at"                  TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE TYPE "PurchaseLinkKind" AS ENUM ('MARKETPLACE', 'OFFICIAL_WEBSITE', 'OTHER');
CREATE TABLE "purchase_link" (
  "id"                TEXT PRIMARY KEY,
  "recommendation_id" TEXT NOT NULL REFERENCES "recommendation"("id"),
  "label"             TEXT NOT NULL,
  "url"               TEXT NOT NULL,
  "kind"              "PurchaseLinkKind" NOT NULL DEFAULT 'OTHER'
);

CREATE TABLE "collection" (
  "id"         TEXT PRIMARY KEY,
  "space_id"   TEXT NOT NULL REFERENCES "space"("id"),
  "name"       TEXT NOT NULL,
  "icon"       TEXT,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
  UNIQUE ("space_id", "name")
);

CREATE TABLE "collection_recommendation" (
  "collection_id"     TEXT NOT NULL REFERENCES "collection"("id"),
  "recommendation_id" TEXT NOT NULL REFERENCES "recommendation"("id"),
  PRIMARY KEY ("collection_id", "recommendation_id")
);

CREATE TABLE "search_keyword" (
  "id"       TEXT PRIMARY KEY,
  "space_id" TEXT NOT NULL REFERENCES "space"("id"),
  "label"    TEXT NOT NULL,
  UNIQUE ("space_id", "label")
);

CREATE TABLE "recommendation_keyword" (
  "recommendation_id" TEXT NOT NULL REFERENCES "recommendation"("id"),
  "keyword_id"        TEXT NOT NULL REFERENCES "search_keyword"("id"),
  PRIMARY KEY ("recommendation_id", "keyword_id")
);

CREATE TABLE "experience" (
  "id"                TEXT PRIMARY KEY,
  "recommendation_id" TEXT NOT NULL REFERENCES "recommendation"("id"),
  "place_id"          TEXT REFERENCES "place"("id"),
  "author_id"         TEXT NOT NULL REFERENCES "app_user"("id"),
  "rating"            INTEGER NOT NULL,
  "comment"           TEXT,
  "visited_at"        TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE TABLE "photo" (
  "id"                TEXT PRIMARY KEY,
  "url"               TEXT NOT NULL,
  "kind"              TEXT NOT NULL,
  "place_id"          TEXT REFERENCES "place"("id"),
  "recommendation_id" TEXT REFERENCES "recommendation"("id"),
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- ========== Índices (DATABASE_SPEC.md §Índices) ==========
CREATE INDEX "recommendation_search_vector_idx" ON "recommendation" USING GIN ("search_vector");
CREATE INDEX "recommendation_name_trgm_idx" ON "recommendation" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "place_name_trgm_idx" ON "place" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "place_geom_idx" ON "place" USING GIST ("geom");
CREATE INDEX "recommendation_space_id_idx" ON "recommendation" ("space_id");
CREATE INDEX "place_space_id_idx" ON "place" ("space_id");
CREATE INDEX "brand_space_id_idx" ON "brand" ("space_id");
CREATE INDEX "collection_space_id_idx" ON "collection" ("space_id");
CREATE INDEX "search_keyword_space_id_idx" ON "search_keyword" ("space_id");

-- ========== Triggers (DATABASE_SPEC.md §Triggers) ==========

-- updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recommendation_updated_at BEFORE UPDATE ON "recommendation"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER place_updated_at BEFORE UPDATE ON "place"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- search_vector: nome + descrição + categoria + keywords (INV-002)
CREATE OR REPLACE FUNCTION refresh_recommendation_search_vector(rec_id TEXT) RETURNS VOID AS $$
BEGIN
  UPDATE "recommendation" r
  SET search_vector =
    setweight(to_tsvector('portuguese', coalesce(r.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(r.description, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce((SELECT c.name FROM "recommendation_category" c WHERE c.id = r.category_id), '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce((
      SELECT string_agg(k.label, ' ')
      FROM "recommendation_keyword" rk
      JOIN "search_keyword" k ON k.id = rk.keyword_id
      WHERE rk.recommendation_id = r.id
    ), '')), 'C')
  WHERE r.id = rec_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recommendation_search_vector_trigger() RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_recommendation_search_vector(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recommendation_search_vector_ins_upd
  AFTER INSERT OR UPDATE OF name, description, category_id ON "recommendation"
  FOR EACH ROW EXECUTE FUNCTION recommendation_search_vector_trigger();

-- keywords são M:N (tabela separada) — precisa de trigger próprio pra refletir no pai
CREATE OR REPLACE FUNCTION recommendation_keyword_search_vector_trigger() RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_recommendation_search_vector(COALESCE(NEW.recommendation_id, OLD.recommendation_id));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recommendation_keyword_search_vector
  AFTER INSERT OR DELETE ON "recommendation_keyword"
  FOR EACH ROW EXECUTE FUNCTION recommendation_keyword_search_vector_trigger();

-- ========== Row-Level Security (DATABASE_SPEC.md §RLS) ==========
-- current_user_id(): resolve o usuário autenticado a partir do JWT do Supabase (claim "sub").
CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE sql STABLE;

ALTER TABLE "recommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "place" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "search_keyword" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_recommendation ON "recommendation"
  USING (space_id IN (SELECT space_id FROM "space_member" WHERE user_id = current_user_id()));
CREATE POLICY tenant_isolation_place ON "place"
  USING (space_id IN (SELECT space_id FROM "space_member" WHERE user_id = current_user_id()));
CREATE POLICY tenant_isolation_brand ON "brand"
  USING (space_id IN (SELECT space_id FROM "space_member" WHERE user_id = current_user_id()));
CREATE POLICY tenant_isolation_collection ON "collection"
  USING (space_id IN (SELECT space_id FROM "space_member" WHERE user_id = current_user_id()));
CREATE POLICY tenant_isolation_search_keyword ON "search_keyword"
  USING (space_id IN (SELECT space_id FROM "space_member" WHERE user_id = current_user_id()));

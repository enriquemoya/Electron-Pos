CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content_json JSONB NOT NULL,
  cover_image_url TEXT,
  author_name TEXT NOT NULL,
  reading_time_minutes INTEGER NOT NULL,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_blog_posts_slug_locale
  ON blog_posts(slug, locale);

CREATE INDEX IF NOT EXISTS idx_blog_posts_locale_published
  ON blog_posts(locale, is_published, published_at DESC);

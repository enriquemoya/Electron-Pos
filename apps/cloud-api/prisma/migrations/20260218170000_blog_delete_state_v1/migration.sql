ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_blog_posts_deleted
  ON blog_posts(is_deleted, locale, published_at DESC);

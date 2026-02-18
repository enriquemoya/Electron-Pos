ALTER TABLE "blog_posts"
ADD COLUMN IF NOT EXISTS "deleted_by_admin_name" TEXT;

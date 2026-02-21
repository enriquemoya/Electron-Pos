-- Branch location model migration: remove coordinate fields and use Google Maps URL.
ALTER TABLE "pickup_branches"
ADD COLUMN "google_maps_url" TEXT;

ALTER TABLE "pickup_branches"
DROP COLUMN "latitude",
DROP COLUMN "longitude";

ALTER TABLE personal_collection_watches
  ADD COLUMN IF NOT EXISTS gdrive_link TEXT;

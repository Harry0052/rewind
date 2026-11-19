ALTER TABLE receipts ADD COLUMN original_name TEXT;
ALTER TABLE receipts ADD COLUMN mime_type TEXT;
ALTER TABLE receipts ADD COLUMN byte_size INTEGER;
ALTER TABLE receipts ADD COLUMN storage_key TEXT;

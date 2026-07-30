-- Drop vector dependency: convert embedding from vector(1536) to text
-- Full-text search replaced vector similarity, so the vector type is no longer needed.

ALTER TABLE document_chunks ALTER COLUMN embedding TYPE text USING embedding::text;

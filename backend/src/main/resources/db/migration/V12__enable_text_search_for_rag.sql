-- Switch RAG from vector similarity to full-text search
-- The vector(1536) embedding approach requires an embedding API (e.g. OpenAI text-embedding-ada-002)
-- which isn't available with the current Groq-only provider.
-- Full-text search lets us find relevant chunks immediately using PostgreSQL's built-in engine.

DROP INDEX IF EXISTS idx_document_chunks_embedding;

ALTER TABLE document_chunks ALTER COLUMN embedding DROP NOT NULL;

ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', COALESCE(content, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_document_chunks_search
    ON document_chunks USING gin(search_vector);

-- Restore vector type for embedding column (all-MiniLM-L6-v2: 384 dimensions)
-- and add an IVFFlat index for approximate nearest-neighbor search.

ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(384) USING embedding::vector;

CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
    ON document_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

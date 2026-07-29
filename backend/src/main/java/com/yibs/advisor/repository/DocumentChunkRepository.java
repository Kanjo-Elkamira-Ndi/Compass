package com.yibs.advisor.repository;

import com.yibs.advisor.domain.ai.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {

    List<DocumentChunk> findBySourceDocument(String sourceDocument);

    @Query(value = "SELECT * FROM document_chunks " +
            "WHERE search_vector @@ to_tsquery('english', :tsquery) " +
            "ORDER BY ts_rank(search_vector, to_tsquery('english', :tsquery)) DESC " +
            "LIMIT :limit", nativeQuery = true)
    List<DocumentChunk> findByTextSearch(
        @Param("tsquery") String tsquery,
        @Param("limit") int limit
    );

    @Query(value = "SELECT * FROM document_chunks " +
            "WHERE search_vector @@ to_tsquery('english', :tsquery) " +
            "AND source_document = :source " +
            "ORDER BY ts_rank(search_vector, to_tsquery('english', :tsquery)) DESC " +
            "LIMIT :limit", nativeQuery = true)
    List<DocumentChunk> findByTextSearchInDocument(
        @Param("tsquery") String tsquery,
        @Param("source") String source,
        @Param("limit") int limit
    );

    @Query(value = "SELECT id, source_document, page_number, content, embedding, created_at, " +
            "1 - (embedding::vector <=> CAST(:embedding AS vector)) AS score " +
            "FROM document_chunks " +
            "WHERE embedding IS NOT NULL " +
            "ORDER BY embedding::vector <=> CAST(:embedding AS vector) " +
            "LIMIT :limit", nativeQuery = true)
    List<Object[]> findNearestNeighborsWithScore(
        @Param("embedding") String embedding,
        @Param("limit") int limit
    );

    @Query(value = "SELECT id, source_document, page_number, content, embedding, created_at, " +
            "ts_rank(search_vector, to_tsquery('english', :tsquery)) AS score " +
            "FROM document_chunks " +
            "WHERE search_vector @@ to_tsquery('english', :tsquery) " +
            "ORDER BY score DESC " +
            "LIMIT :limit", nativeQuery = true)
    List<Object[]> findByTextSearchWithScore(
        @Param("tsquery") String tsquery,
        @Param("limit") int limit
    );

    @Query(value = "SELECT id, source_document, page_number, content, embedding, created_at, " +
            "ts_rank(search_vector, to_tsquery('english', :tsquery)) AS score " +
            "FROM document_chunks " +
            "WHERE search_vector @@ to_tsquery('english', :tsquery) " +
            "AND source_document = :source " +
            "ORDER BY score DESC " +
            "LIMIT :limit", nativeQuery = true)
    List<Object[]> findByTextSearchInDocumentWithScore(
        @Param("tsquery") String tsquery,
        @Param("source") String source,
        @Param("limit") int limit
    );
}

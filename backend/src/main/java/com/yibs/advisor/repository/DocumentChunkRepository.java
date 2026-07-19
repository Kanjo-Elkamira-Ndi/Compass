package com.yibs.advisor.repository;

import com.yibs.advisor.domain.ai.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {

    @Query(value = "SELECT * FROM document_chunks " +
            "ORDER BY embedding <=> CAST(:embedding AS vector) " +
            "LIMIT :limit", nativeQuery = true)
    List<DocumentChunk> findNearestNeighbors(
        @Param("embedding") String embedding,
        @Param("limit") int limit
    );
}

package com.yibs.advisor.service.ai.rag;

import com.yibs.advisor.domain.ai.DocumentChunk;
import com.yibs.advisor.repository.DocumentChunkRepository;
import com.yibs.advisor.service.ai.embedding.EmbeddingService;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagRetrievalService {

    private final DocumentChunkRepository documentChunkRepository;
    private final AIProviderStrategy aiProvider;
    private final EmbeddingService embeddingService;

    private static final int DEFAULT_LIMIT = 6;
    // No embedding provider currently resolves for the configured AI provider (Groq
    // doesn't implement an embeddings endpoint — embed() always fails and falls back to
    // an empty vector, so hybrid search runs FTS-only in practice for every document in
    // the corpus). With ranking resting entirely on keyword-match scores, a query on a
    // generic term (e.g. "manager") competing against a much larger source like the
    // handbook can get pushed out of a narrow candidate pool. Widened from 20 to reduce
    // that risk; cheap to raise further since this is a single indexed FTS query.
    private static final int HYBRID_CANDIDATES = 40;
    private static final int RRF_K = 60;

    private static final Set<String> STOP_WORDS = Set.of(
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "shall", "can", "need", "dare", "ought",
        "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
        "as", "into", "through", "during", "before", "after", "above", "below",
        "between", "out", "off", "over", "under", "again", "further", "then",
        "once", "here", "there", "when", "where", "why", "how", "all", "each",
        "every", "both", "few", "more", "most", "other", "some", "such", "no",
        "nor", "not", "only", "own", "same", "so", "than", "too", "very",
        "just", "because", "but", "and", "or", "if", "while", "about", "what",
        "which", "who", "whom", "this", "that", "these", "those", "am", "it",
        "its", "me", "my", "tell", "give", "know", "want", "like", "get", "make"
    );

    public List<DocumentChunk> retrieveRelevantChunks(String query) {
        return retrieveRelevantChunks(query, null, DEFAULT_LIMIT);
    }

    public List<DocumentChunk> retrieveRelevantChunks(String query, String sourceDocument) {
        return retrieveRelevantChunks(query, sourceDocument, DEFAULT_LIMIT);
    }

    public List<DocumentChunk> retrieveRelevantChunks(String query, String sourceDocument, int limit) {
        try {
            String expanded = expandQuery(query);
            String tsquery = buildTsQuery(expanded);
            if (tsquery.isEmpty()) {
                return Collections.emptyList();
            }

            List<ScoredChunk> fused = hybridSearch(tsquery, sourceDocument, expanded);
            if (fused.isEmpty()) {
                log.debug("No relevant chunks found for query: {}", tsquery);
                return Collections.emptyList();
            }

            fused.sort((a, b) -> Double.compare(b.score, a.score));
            List<DocumentChunk> top = fused.stream()
                    .limit(limit)
                    .map(s -> s.chunk)
                    .toList();

            log.debug("Retrieved {} chunks via hybrid search ({} candidates fused)", top.size(), fused.size());
            return top;
        } catch (Exception e) {
            log.warn("Hybrid search failed, falling back to all chunks: {}", e.getMessage());
            List<DocumentChunk> all = documentChunkRepository.findAll();
            return all.size() > limit ? all.subList(0, limit) : all;
        }
    }

    private List<ScoredChunk> hybridSearch(String tsquery, String sourceDocument, String rawQuery) {
        Map<UUID, ScoredChunk> fused = new LinkedHashMap<>();

        List<Object[]> ftsResults;
        if (sourceDocument != null) {
            ftsResults = documentChunkRepository.findByTextSearchInDocumentWithScore(tsquery, sourceDocument, HYBRID_CANDIDATES);
        } else {
            ftsResults = documentChunkRepository.findByTextSearchWithScore(tsquery, HYBRID_CANDIDATES);
        }

        for (int rank = 0; rank < ftsResults.size(); rank++) {
            Object[] row = ftsResults.get(rank);
            DocumentChunk chunk = rowToChunk(row);
            double rrfScore = 1.0 / (RRF_K + rank + 1);
            fused.put(chunk.getId(), new ScoredChunk(chunk, rrfScore));
        }

        if (embeddingService.isAvailable()) {
            try {
                float[] queryVector = embeddingService.embed(rawQuery);
                if (queryVector.length > 0) {
                    String vectorStr = embeddingService.toVectorString(queryVector);
                    List<Object[]> vecResults = documentChunkRepository.findNearestNeighborsWithScore(vectorStr, HYBRID_CANDIDATES);

                    for (int rank = 0; rank < vecResults.size(); rank++) {
                        Object[] row = vecResults.get(rank);
                        DocumentChunk chunk = rowToChunk(row);
                        double rrfScore = 1.0 / (RRF_K + rank + 1);
                        fused.merge(chunk.getId(), new ScoredChunk(chunk, rrfScore),
                                (existing, incoming) -> new ScoredChunk(existing.chunk, existing.score + incoming.score));
                    }
                }
            } catch (Exception e) {
                log.warn("Vector search failed, using FTS-only results: {}", e.getMessage());
            }
        }

        return new ArrayList<>(fused.values());
    }

    private DocumentChunk rowToChunk(Object[] row) {
        return DocumentChunk.builder()
                .id((UUID) row[0])
                .sourceDocument((String) row[1])
                .pageNumber(row[2] != null ? ((Number) row[2]).shortValue() : null)
                .content((String) row[3])
                .embedding((String) row[4])
                .createdAt(row[5] != null ? OffsetDateTime.parse(row[5].toString()) : null)
                .build();
    }

    private record ScoredChunk(DocumentChunk chunk, double score) {}

    private String expandQuery(String query) {
        try {
            String prompt = "Given the user question below, generate 3 very short alternative search queries " +
                    "(3-6 key words each, no stop words) that would help find the answer in a university " +
                    "document database. Use different keywords and synonyms each time. " +
                    "Return each on its own line, no numbers or bullets.\n\nQuestion: " + query;

            String expanded = aiProvider.chat(
                    "You are a search query optimizer. Return only the alternative queries, one per line.",
                    prompt
            );

            StringBuilder combined = new StringBuilder(query);
            for (String line : expanded.split("\n")) {
                String alt = line.replaceAll("^[\\d\\s.\\-*•]+", "").trim();
                if (!alt.isEmpty() && !alt.equalsIgnoreCase(query)) {
                    combined.append(" ").append(alt);
                }
            }
            return combined.toString();
        } catch (Exception e) {
            log.debug("Query expansion failed, using original query: {}", e.getMessage());
            return query;
        }
    }

    private String buildTsQuery(String query) {
        return Arrays.stream(query.toLowerCase().split("\\W+"))
                .filter(word -> word.length() > 2)
                .filter(word -> !STOP_WORDS.contains(word))
                .distinct()
                .collect(Collectors.joining(" | "));
    }
}

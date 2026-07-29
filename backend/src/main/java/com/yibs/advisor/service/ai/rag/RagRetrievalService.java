package com.yibs.advisor.service.ai.rag;

import com.yibs.advisor.domain.ai.DocumentChunk;
import com.yibs.advisor.repository.DocumentChunkRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagRetrievalService {

    private final DocumentChunkRepository documentChunkRepository;
    private final AIProviderStrategy aiProvider;

    private static final int DEFAULT_LIMIT = 5;

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

            List<DocumentChunk> results;
            if (sourceDocument != null) {
                results = documentChunkRepository.findByTextSearchInDocument(tsquery, sourceDocument, limit);
            } else {
                results = documentChunkRepository.findByTextSearch(tsquery, limit);
            }

            if (results.isEmpty()) {
                log.debug("No relevant chunks found for query: {}", tsquery);
                return Collections.emptyList();
            }

            log.debug("Retrieved {} relevant chunks for tsquery: {}", results.size(), tsquery);
            return results;
        } catch (Exception e) {
            log.warn("Full-text search failed, falling back to all chunks: {}", e.getMessage());
            List<DocumentChunk> all = documentChunkRepository.findAll();
            return all.size() > limit ? all.subList(0, limit) : all;
        }
    }

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

package com.yibs.advisor.service.ai.rag;

import com.yibs.advisor.dto.response.WebSearchResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class WebSearchService {

    private final RestTemplate restTemplate;
    private final String apiKey;

    private static final String TAVILY_URL = "https://api.tavily.com/search";
    private static final int MAX_RESULTS = 5;

    public WebSearchService(
            @Value("${app.ai.tavily.api-key:}") String apiKey,
            RestTemplateBuilder builder) {
        this.apiKey = apiKey;
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(15))
                .build();
    }

    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    public List<WebSearchResult> search(String query) {
        if (!isAvailable()) {
            log.debug("Tavily API key not configured, skipping web search");
            return Collections.emptyList();
        }
        try {
            Map<String, Object> body = Map.of(
                    "api_key", apiKey,
                    "query", query,
                    "search_depth", "basic",
                    "max_results", MAX_RESULTS
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    TAVILY_URL, request, Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("Tavily search returned {}", response.getStatusCode());
                return Collections.emptyList();
            }

            Map<String, Object> responseBody = response.getBody();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = (List<Map<String, Object>>) responseBody.get("results");
            if (results == null || results.isEmpty()) {
                return Collections.emptyList();
            }

            List<WebSearchResult> searchResults = results.stream()
                    .map(r -> WebSearchResult.builder()
                            .title((String) r.getOrDefault("title", ""))
                            .url((String) r.getOrDefault("url", ""))
                            .content((String) r.getOrDefault("content", ""))
                            .score(((Number) r.getOrDefault("score", 0.0)).doubleValue())
                            .build())
                    .filter(r -> !r.getTitle().isBlank())
                    .collect(Collectors.toList());

            log.debug("Tavily search returned {} results for query: {}", searchResults.size(), query);
            return searchResults;
        } catch (Exception e) {
            log.warn("Tavily search failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}

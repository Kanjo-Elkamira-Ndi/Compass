package com.yibs.advisor.service.ai.embedding;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
public class EmbeddingServiceImpl implements EmbeddingService {

    private final EmbeddingModel embeddingModel;

    public EmbeddingServiceImpl(Optional<EmbeddingModel> embeddingModel) {
        this.embeddingModel = embeddingModel.orElse(null);
        if (this.embeddingModel != null) {
            log.info("Embedding model available: {}", this.embeddingModel.getClass().getSimpleName());
        } else {
            log.warn("No EmbeddingModel bean found — hybrid search disabled, FTS-only mode");
        }
    }

    @Override
    public float[] embed(String text) {
        if (embeddingModel == null) return new float[0];
        try {
            return embeddingModel.embed(text);
        } catch (Exception e) {
            log.debug("Embedding call failed ({}), falling back to FTS-only", e.getMessage());
            return new float[0];
        }
    }

    @Override
    public boolean isAvailable() {
        return embeddingModel != null;
    }
}

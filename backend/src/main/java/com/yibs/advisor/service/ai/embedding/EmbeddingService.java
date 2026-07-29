package com.yibs.advisor.service.ai.embedding;

public interface EmbeddingService {

    float[] embed(String text);

    default String toVectorString(float[] vector) {
        if (vector == null || vector.length == 0) return null;
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    default boolean isAvailable() {
        return false;
    }
}

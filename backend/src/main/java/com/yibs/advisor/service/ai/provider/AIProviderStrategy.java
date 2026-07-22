package com.yibs.advisor.service.ai.provider;

public interface AIProviderStrategy {
    String chat(String systemPrompt, String userMessage);
    String chatWithJsonResponse(String systemPrompt, String userMessage);
}

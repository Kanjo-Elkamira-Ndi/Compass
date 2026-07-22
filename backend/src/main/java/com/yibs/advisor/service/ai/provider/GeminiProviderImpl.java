package com.yibs.advisor.service.ai.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "spring.ai.active-provider", havingValue = "gemini")
public class GeminiProviderImpl implements AIProviderStrategy {
    private final ChatClient chatClient;

    public GeminiProviderImpl(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @Override
    public String chat(String systemPrompt, String userMessage) {
        return chatClient.prompt()
                .system(systemPrompt)
                .user(userMessage)
                .call()
                .content();
    }

    @Override
    public String chatWithJsonResponse(String systemPrompt, String userMessage) {
        return chat(systemPrompt + "\n\nRespond with valid JSON only.", userMessage);
    }
}

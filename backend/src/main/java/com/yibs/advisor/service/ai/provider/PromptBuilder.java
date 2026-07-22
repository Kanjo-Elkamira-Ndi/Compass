package com.yibs.advisor.service.ai.provider;

import java.util.ArrayList;
import java.util.List;

public class PromptBuilder {
    private String systemPrompt;
    private final List<String> contextChunks = new ArrayList<>();
    private final StringBuilder userMessage = new StringBuilder();

    public PromptBuilder systemPrompt(String prompt) {
        this.systemPrompt = prompt;
        return this;
    }

    public PromptBuilder addContext(String chunk) {
        this.contextChunks.add(chunk);
        return this;
    }

    public PromptBuilder addUserMessage(String message) {
        if (this.userMessage.length() > 0) {
            this.userMessage.append("\n\n");
        }
        this.userMessage.append(message);
        return this;
    }

    public String buildSystemPrompt() {
        StringBuilder sb = new StringBuilder();
        if (systemPrompt != null) {
            sb.append(systemPrompt);
        }
        if (!contextChunks.isEmpty()) {
            sb.append("\n\nRelevant context:\n");
            for (String chunk : contextChunks) {
                sb.append("- ").append(chunk).append("\n");
            }
        }
        return sb.toString();
    }

    public String buildUserMessage() {
        return userMessage.toString();
    }

    public static PromptBuilder create() {
        return new PromptBuilder();
    }
}

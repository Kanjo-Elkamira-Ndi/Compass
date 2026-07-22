package com.yibs.advisor.service.ai.rag;

import com.yibs.advisor.domain.ai.DocumentChunk;
import com.yibs.advisor.repository.DocumentChunkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagIngestionService {

    private final DocumentChunkRepository documentChunkRepository;

    public int ingestDocument(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        log.info("Ingesting document: {}", fileName);

        String text = extractText(file);
        List<String> chunks = splitIntoChunks(text, 500);
        log.info("Split document into {} chunks", chunks.size());

        int ingested = 0;
        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);

            DocumentChunk documentChunk = DocumentChunk.builder()
                    .sourceDocument(fileName)
                    .pageNumber((short) (i + 1))
                    .content(chunk)
                    .embedding("[]")
                    .build();

            documentChunkRepository.save(documentChunk);
            ingested++;
        }

        log.info("Successfully ingested {} chunks from {}", ingested, fileName);
        return ingested;
    }

    public int ingestText(String text, String sourceName) {
        log.info("Ingesting text from: {}", sourceName);
        List<String> chunks = splitIntoChunks(text, 500);
        log.info("Split text into {} chunks", chunks.size());

        int ingested = 0;
        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);

            DocumentChunk documentChunk = DocumentChunk.builder()
                    .sourceDocument(sourceName)
                    .pageNumber((short) (i + 1))
                    .content(chunk)
                    .embedding("[]")
                    .build();

            documentChunkRepository.save(documentChunk);
            ingested++;
        }

        log.info("Successfully ingested {} chunks from {}", ingested, sourceName);
        return ingested;
    }

    private String extractText(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private List<String> splitIntoChunks(String text, int maxTokens) {
        List<String> chunks = new ArrayList<>();
        String[] paragraphs = text.split("\\n\\n+");
        StringBuilder currentChunk = new StringBuilder();
        int currentSize = 0;

        for (String paragraph : paragraphs) {
            String trimmed = paragraph.trim();
            if (trimmed.isEmpty()) continue;
            int wordCount = trimmed.split("\\s+").length;
            if (currentSize + wordCount > maxTokens && currentChunk.length() > 0) {
                chunks.add(currentChunk.toString().trim());
                currentChunk = new StringBuilder();
                currentSize = 0;
            }
            currentChunk.append(trimmed).append("\n\n");
            currentSize += wordCount;
        }
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }
        return chunks;
    }
}

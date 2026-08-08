package com.yibs.advisor.service.ai.rag;

import com.yibs.advisor.domain.ai.DocumentChunk;
import com.yibs.advisor.dto.response.RagDocumentResponse;
import com.yibs.advisor.repository.DocumentChunkRepository;
import com.yibs.advisor.service.ai.embedding.EmbeddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagIngestionService {

    private final DocumentChunkRepository documentChunkRepository;
    private final EmbeddingService embeddingService;

    public int ingestDocument(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        log.info("Ingesting document: {}", fileName);

        String text = extractText(file);
        return ingestText(text, fileName);
    }

    /**
     * Ingests the file and returns a full document record describing it, for
     * endpoints (like the admin upload) that need to render it immediately
     * without a round-trip re-fetch.
     */
    public RagDocumentResponse ingestAndDescribe(MultipartFile file, String uploadedBy) throws IOException {
        String fileName = file.getOriginalFilename();
        int chunks = ingestDocument(file);

        return RagDocumentResponse.builder()
                .id(fileName)
                .fileName(fileName)
                .fileType(fileExtension(fileName))
                .fileSize(file.getSize())
                .chunkCount(chunks)
                .uploadedBy(uploadedBy)
                .uploadedAt(OffsetDateTime.now())
                .status("indexed")
                .build();
    }

    /** Lists every distinct document currently in the RAG knowledge base. */
    public List<RagDocumentResponse> listDocuments() {
        return documentChunkRepository.findDocumentStats().stream()
                .map(row -> {
                    String fileName = (String) row[0];
                    long chunkCount = ((Number) row[1]).longValue();
                    OffsetDateTime uploadedAt = row[2] instanceof OffsetDateTime
                            ? (OffsetDateTime) row[2]
                            : null;
                    return RagDocumentResponse.builder()
                            .id(fileName)
                            .fileName(fileName)
                            .fileType(fileExtension(fileName))
                            .fileSize(0)
                            .chunkCount(chunkCount)
                            .uploadedBy("—")
                            .uploadedAt(uploadedAt)
                            .status("indexed")
                            .build();
                })
                .toList();
    }

    private String fileExtension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        return dot >= 0 && dot < fileName.length() - 1 ? fileName.substring(dot + 1).toUpperCase() : "";
    }

    public int ingestFromFile(String filePath) throws IOException {
        Path path = Path.of(filePath);
        String fileName = path.getFileName().toString();
        log.info("Ingesting document from file: {}", filePath);

        try (PDDocument document = Loader.loadPDF(path.toFile())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            return ingestText(text, fileName);
        }
    }

    public int ingestText(String text, String sourceName) {
        List<DocumentChunk> existing = documentChunkRepository.findBySourceDocument(sourceName);
        if (!existing.isEmpty()) {
            log.info("Document '{}' already ingested ({} chunks), skipping", sourceName, existing.size());
            return existing.size();
        }

        List<String> chunks = splitIntoChunks(text, 800);
        log.info("Split '{}' into {} chunks", sourceName, chunks.size());

        int ingested = 0;
        for (int i = 0; i < chunks.size(); i++) {
            String chunkText = chunks.get(i);
            String embedding = null;
            if (embeddingService.isAvailable()) {
                embedding = embeddingService.toVectorString(embeddingService.embed(chunkText));
            }

            DocumentChunk documentChunk = DocumentChunk.builder()
                    .sourceDocument(sourceName)
                    .pageNumber((short) (i + 1))
                    .content(chunkText)
                    .embedding(embedding)
                    .build();

            documentChunkRepository.save(documentChunk);
            ingested++;
        }

        long withEmbeddings = documentChunkRepository.findBySourceDocument(sourceName)
                .stream().filter(c -> c.getEmbedding() != null).count();
        log.info("Successfully ingested {} chunks from {} (chunks with embeddings: {}/{})", ingested, sourceName,
                withEmbeddings, ingested);
        return ingested;
    }

    private String extractText(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private List<String> splitIntoChunks(String text, int maxChars) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) return chunks;

        String cleaned = text.replaceAll("\r\n?", "\n");
        int start = 0;

        while (start < cleaned.length()) {
            if (chunks.size() > 1000) break;

            int end = findChunkEnd(cleaned, start, maxChars);
            String chunk = cleaned.substring(start, end).trim();
            if (!chunk.isEmpty()) {
                chunks.add(chunk);
            }

            if (end >= cleaned.length()) break;

            start = Math.max(end - 150, start + 1);
        }

        return chunks;
    }

    private int findChunkEnd(String text, int start, int maxChars) {
        if (start + maxChars >= text.length()) {
            return text.length();
        }

        int end = start + maxChars;
        String window = text.substring(start, end);

        int paraBreak = window.lastIndexOf("\n\n");
        if (paraBreak > 50) return start + paraBreak;

        int lineBreak = window.lastIndexOf('\n');
        if (lineBreak > 50) return start + lineBreak;

        for (int i = window.length() - 1; i >= 50; i--) {
            char c = window.charAt(i);
            if (c == '.' || c == '!' || c == '?') {
                if (i + 1 < window.length() && Character.isWhitespace(window.charAt(i + 1))) {
                    return start + i + 1;
                }
            }
        }

        int spaceBreak = window.lastIndexOf(' ');
        if (spaceBreak > 50) return start + spaceBreak;

        return end;
    }
}

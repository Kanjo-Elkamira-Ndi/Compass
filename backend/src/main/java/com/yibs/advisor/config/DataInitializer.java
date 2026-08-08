package com.yibs.advisor.config;

import com.yibs.advisor.repository.DocumentChunkRepository;
import com.yibs.advisor.service.ai.rag.RagIngestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Ingests the RAG knowledge base's baseline documents on startup — the student
 * handbook, plus internal documents (like staff appointment memos) that exist
 * only in the docs/ folder and aren't available anywhere on the public internet.
 * Each is skipped once already ingested (see RagIngestionService#ingestText),
 * so this is safe to run on every boot.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final List<String> BASELINE_DOCUMENTS = List.of(
            "yibs_student_handbook.pdf",
            "Appointments, Senoir Administrative Staff.pdf",
            "Appointments, Managers and Heads of Department.pdf"
    );

    private final RagIngestionService ragIngestionService;
    private final DocumentChunkRepository documentChunkRepository;

    @Override
    public void run(String... args) {
        for (String fileName : BASELINE_DOCUMENTS) {
            ingestIfMissing(fileName);
        }
    }

    private void ingestIfMissing(String fileName) {
        if (!documentChunkRepository.findBySourceDocument(fileName).isEmpty()) {
            log.info("'{}' already ingested, skipping", fileName);
            return;
        }

        try {
            Path path = Path.of("docs", fileName);
            if (!Files.exists(path)) {
                log.warn("'{}' not found at 'docs/{}', trying 'backend/docs/{}'", fileName, fileName, fileName);
                path = Path.of("backend", "docs", fileName);
            }

            if (Files.exists(path)) {
                int chunks = ragIngestionService.ingestFromFile(path.toString());
                log.info("'{}' ingested: {} chunks created", fileName, chunks);
            } else {
                log.warn("'{}' not found at either location, skipping", fileName);
            }
        } catch (Exception e) {
            log.error("Failed to ingest '{}': {}", fileName, e.getMessage());
        }
    }
}

package com.yibs.advisor.config;

import com.yibs.advisor.repository.DocumentChunkRepository;
import com.yibs.advisor.service.ai.rag.RagIngestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RagIngestionService ragIngestionService;
    private final DocumentChunkRepository documentChunkRepository;

    @Override
    public void run(String... args) {
        String handbookPath = "docs/yibs_student_handbook.pdf";
        String handbookName = "yibs_student_handbook.pdf";

        if (!documentChunkRepository.findBySourceDocument(handbookName).isEmpty()) {
            log.info("YIBS Student Handbook already ingested, skipping");
            return;
        }

        try {
            Path path = Path.of(handbookPath);
            if (!Files.exists(path)) {
                log.warn("Handbook not found at '{}', trying 'backend/{}'", handbookPath, handbookPath);
                path = Path.of("backend", handbookPath);
            }

            if (Files.exists(path)) {
                int chunks = ragIngestionService.ingestFromFile(path.toString());
                log.info("YIBS Student Handbook ingested: {} chunks created", chunks);
            } else {
                log.warn("YIBS Student Handbook not found at either location");
            }
        } catch (Exception e) {
            log.error("Failed to ingest YIBS Student Handbook: {}", e.getMessage());
        }
    }
}

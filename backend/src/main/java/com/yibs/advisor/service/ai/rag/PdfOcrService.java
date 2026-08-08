package com.yibs.advisor.service.ai.rag;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.concurrent.TimeUnit;

/**
 * OCR fallback for PDFs that are scans/photos with no embedded text layer
 * (e.g. exported from a phone scanning app) — PDFTextStripper reads nothing
 * from these, so without this, RagIngestionService would silently index zero
 * usable content. Shells out to the system `tesseract` binary rather than
 * pulling in a JNI OCR dependency, since it's what's actually available in
 * this environment; if it's missing, callers get an empty string back and
 * log a warning instead of failing ingestion outright.
 */
@Slf4j
@Service
public class PdfOcrService {

    private static final float OCR_DPI = 300f;

    private volatile Boolean tesseractAvailable;

    public boolean isAvailable() {
        if (tesseractAvailable == null) {
            tesseractAvailable = probeTesseract();
        }
        return tesseractAvailable;
    }

    private boolean probeTesseract() {
        try {
            Process process = new ProcessBuilder("tesseract", "--version")
                    .redirectErrorStream(true)
                    .start();
            boolean finished = process.waitFor(10, TimeUnit.SECONDS);
            return finished && process.exitValue() == 0;
        } catch (Exception e) {
            log.warn("Tesseract OCR is not available on this machine ({}) — scanned/image-only PDFs " +
                    "will be skipped rather than OCR'd", e.getMessage());
            return false;
        }
    }

    /** OCRs every page of the document and returns the concatenated text, or "" if OCR isn't available. */
    public String extractText(PDDocument document) {
        if (!isAvailable()) {
            return "";
        }

        PDFRenderer renderer = new PDFRenderer(document);
        StringBuilder text = new StringBuilder();
        for (int page = 0; page < document.getNumberOfPages(); page++) {
            try {
                BufferedImage image = renderer.renderImageWithDPI(page, OCR_DPI);
                String pageText = ocrImage(image);
                if (!pageText.isBlank()) {
                    text.append(pageText).append("\n\n");
                }
            } catch (Exception e) {
                log.warn("Failed to OCR page {}: {}", page + 1, e.getMessage());
            }
        }
        return text.toString();
    }

    private String ocrImage(BufferedImage image) throws IOException, InterruptedException {
        File tempImage = File.createTempFile("ocr-page-", ".png");
        File outputBase = File.createTempFile("ocr-out-", "");
        // tesseract writes to <outputBase>.txt itself; the empty file we just
        // created would otherwise collide with that, so drop it first.
        Files.deleteIfExists(outputBase.toPath());

        try {
            ImageIO.write(image, "png", tempImage);
            Process process = new ProcessBuilder(
                    "tesseract", tempImage.getAbsolutePath(), outputBase.getAbsolutePath()
            ).redirectErrorStream(true).start();
            boolean finished = process.waitFor(60, TimeUnit.SECONDS);

            File outFile = new File(outputBase.getAbsolutePath() + ".txt");
            // tesseract can exit non-zero on warnings (e.g. orientation guesses)
            // while still writing usable output, so check for the file, not the code.
            if (finished && outFile.exists()) {
                return Files.readString(outFile.toPath());
            }
            return "";
        } finally {
            Files.deleteIfExists(tempImage.toPath());
            Files.deleteIfExists(new File(outputBase.getAbsolutePath() + ".txt").toPath());
        }
    }
}

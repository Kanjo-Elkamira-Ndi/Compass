package com.yibs.advisor.controller;

import com.yibs.advisor.domain.publicsite.Lead;
import com.yibs.advisor.domain.publicsite.LeadStatus;
import com.yibs.advisor.dto.request.ContactRequest;
import com.yibs.advisor.dto.request.NewsletterRequest;
import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.dto.response.PublicStatsResponse;
import com.yibs.advisor.repository.LeadRepository;
import com.yibs.advisor.service.publicsite.PublicStatsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

    private final PublicStatsService publicStatsService;
    private final LeadRepository leadRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<PublicStatsResponse>> getStats() {
        PublicStatsResponse stats = publicStatsService.getStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @PostMapping("/contact")
    public ResponseEntity<ApiResponse<Void>> submitContact(@Valid @RequestBody ContactRequest request) {
        // Honeypot check — bots fill this, humans don't
        if (request.getWebsite() != null && !request.getWebsite().isEmpty()) {
            // Silently "succeed" for bots
            return ResponseEntity.ok(ApiResponse.ok("Thank you for your message!", null));
        }

        // HTML-strip the message
        String cleanMessage = stripHtml(request.getMessage());

        Lead lead = Lead.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .roleInterest(request.getRoleInterest())
                .message(cleanMessage)
                .source("landing_page")
                .status(LeadStatus.NEW)
                .build();

        leadRepository.save(lead);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Thank you for your message! We'll get back to you within 24 hours.", null));
    }

    @PostMapping("/newsletter")
    public ResponseEntity<ApiResponse<Void>> subscribeNewsletter(@Valid @RequestBody NewsletterRequest request) {
        // Honeypot check
        if (request.getWebsite() != null && !request.getWebsite().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.ok("Subscribed successfully!", null));
        }

        Lead lead = Lead.builder()
                .fullName("Newsletter Subscriber")
                .email(request.getEmail())
                .source("newsletter")
                .status(LeadStatus.NEW)
                .build();

        leadRepository.save(lead);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Subscribed successfully!", null));
    }

    private String stripHtml(String input) {
        if (input == null) return null;
        return input.replaceAll("<[^>]*>", "").trim();
    }
}

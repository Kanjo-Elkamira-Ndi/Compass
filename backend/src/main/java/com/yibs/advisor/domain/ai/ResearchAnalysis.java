package com.yibs.advisor.domain.ai;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import com.yibs.advisor.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "research_analyses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResearchAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private String summary;

    @Type(JsonType.class)
    @Column(name = "key_findings", columnDefinition = "jsonb")
    private List<String> keyFindings;

    @Type(JsonType.class)
    @Column(name = "research_gaps", columnDefinition = "jsonb")
    private List<String> researchGaps;

    @Type(JsonType.class)
    @Column(name = "future_work", columnDefinition = "jsonb")
    private List<String> futureWork;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}

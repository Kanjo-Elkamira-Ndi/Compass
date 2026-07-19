package com.yibs.advisor.domain.ai;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import com.yibs.advisor.domain.user.Lecturer;
import com.yibs.advisor.domain.user.Student;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "risk_assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessed_by")
    private Lecturer assessedBy;

    @Column(name = "risk_score")
    private BigDecimal riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    private RiskLevel riskLevel;

    @Type(JsonType.class)
    @Column(name = "risk_factors", columnDefinition = "jsonb")
    @Builder.Default
    private List<Map<String, Object>> riskFactors = List.of();

    @Column(name = "assessed_at", nullable = false)
    @Builder.Default
    private OffsetDateTime assessedAt = OffsetDateTime.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}

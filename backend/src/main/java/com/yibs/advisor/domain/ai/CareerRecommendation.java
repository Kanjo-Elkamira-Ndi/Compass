package com.yibs.advisor.domain.ai;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import com.yibs.advisor.domain.user.Student;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "career_recommendations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String title;

    @Column(name = "match_score")
    private BigDecimal matchScore;

    @Column(name = "demand_level")
    private String demandLevel;

    private String rationale;

    @Type(JsonType.class)
    @Column(name = "skills_to_develop", columnDefinition = "jsonb")
    private List<String> skillsToDevelop;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> certifications;

    @Column(name = "average_salary")
    private String averageSalary;

    @Column(name = "growth_rate")
    private String growthRate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}

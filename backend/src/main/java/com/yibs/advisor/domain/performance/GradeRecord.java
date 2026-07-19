package com.yibs.advisor.domain.performance;

import com.yibs.advisor.domain.course.Course;
import com.yibs.advisor.domain.user.Student;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "grade_records", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_id", "course_id", "semester", "academic_year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private Short semester;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    @Column(name = "attendance_pct")
    private BigDecimal attendancePct;

    @Column(name = "assignment_score")
    private BigDecimal assignmentScore;

    @Column(name = "project_score")
    private BigDecimal projectScore;

    @Column(name = "test_score")
    private BigDecimal testScore;

    @Column(name = "exam_score")
    private BigDecimal examScore;

    @Column(name = "total_score", insertable = false, updatable = false)
    private BigDecimal totalScore;

    @Column(name = "grade_letter")
    private String gradeLetter;

    @Column(name = "grade_points")
    private BigDecimal gradePoints;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}

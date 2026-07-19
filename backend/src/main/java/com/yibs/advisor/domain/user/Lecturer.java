package com.yibs.advisor.domain.user;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "lecturers")
@DiscriminatorValue("LECTURER")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Lecturer extends User {

    @Column(name = "staff_id", nullable = false, unique = true)
    private String staffId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String department;

    private String specialisation;

    @Override
    public String getDisplayName() {
        return firstName + " " + lastName;
    }

    @Override
    public String getDashboardUrl() {
        return "/lecturer/dashboard";
    }
}

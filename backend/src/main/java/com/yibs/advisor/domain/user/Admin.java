package com.yibs.advisor.domain.user;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@DiscriminatorValue("ADMIN")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Admin extends User {

    @Override
    public String getDisplayName() {
        return getEmail();
    }

    @Override
    public String getDashboardUrl() {
        return "/admin/users";
    }
}

package com.yibs.advisor.domain.user;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.*;

@Entity
@DiscriminatorValue("ADMIN")
@Getter
@Setter
@NoArgsConstructor
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

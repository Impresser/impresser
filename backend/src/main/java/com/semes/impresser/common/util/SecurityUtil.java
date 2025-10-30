package com.semes.impresser.common.util;

import com.semes.impresser.user.entity.UserRole;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {

    public static Optional<UUID> getCurrentUserUuid() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof String) {
            try {
                return Optional.of(UUID.fromString((String) authentication.getPrincipal()));
            } catch (IllegalArgumentException e) {
                return Optional.empty();
            }
        }
        return Optional.empty();
    }

    public static Optional<UserRole> getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getAuthorities() != null) {
            return authentication.getAuthorities().stream()
                .map(authority -> {
                    String authorityName = authority.getAuthority();
                    if (authorityName.startsWith("ROLE_")) {
                        try {
                            return UserRole.valueOf(authorityName.substring(5));
                        } catch (IllegalArgumentException e) {
                            return null;
                        }
                    }
                    return null;
                })
                .filter(role -> role != null)
                .findFirst();
        }
        return Optional.empty();
    }
}

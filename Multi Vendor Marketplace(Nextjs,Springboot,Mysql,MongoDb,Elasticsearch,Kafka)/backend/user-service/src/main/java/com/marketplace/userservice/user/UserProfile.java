package com.marketplace.userservice.user;

import java.util.List;

public record UserProfile(
        String id,
        String name,
        String email,
        String role,
        List<String> favorites
) {
}

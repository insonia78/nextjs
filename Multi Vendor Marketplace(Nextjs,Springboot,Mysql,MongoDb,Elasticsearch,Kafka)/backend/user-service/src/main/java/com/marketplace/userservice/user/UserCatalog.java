package com.marketplace.userservice.user;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class UserCatalog {

    private final List<UserProfile> users = List.of(
            new UserProfile("u-100", "Mia Carter", "mia@example.com", "CUSTOMER", List.of("p-100", "p-103")),
            new UserProfile("u-200", "Northwind Audio", "northwind@example.com", "VENDOR", List.of("p-101")),
            new UserProfile("u-300", "Atelier Mobile", "atelier@example.com", "VENDOR", List.of("p-102", "p-104"))
    );

    public List<UserProfile> findAll() {
        return users;
    }

    public Optional<UserProfile> findById(String id) {
        return users.stream().filter(user -> user.id().equals(id)).findFirst();
    }
}

package com.marketplace.userservice.user;

import com.marketplace.userservice.audit.AuditTrailHook;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserCatalog userCatalog;
    private final AuditTrailHook auditTrailHook;

    public UserController(UserCatalog userCatalog, AuditTrailHook auditTrailHook) {
        this.userCatalog = userCatalog;
        this.auditTrailHook = auditTrailHook;
    }

    @GetMapping
    public List<UserProfile> users() {
        List<UserProfile> users = userCatalog.findAll();
        auditTrailHook.publish("user-service", "list-users", users.size());
        return users;
    }

    @GetMapping("/{id}")
    public UserProfile user(@PathVariable String id) {
        UserProfile user = userCatalog.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        auditTrailHook.publish("user-service", "get-user", id);
        return user;
    }
}

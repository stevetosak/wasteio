package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.dto.TokenResponse;
import com.tosak.wasteio.wasteioapi.dto.UserResponse;
import com.tosak.wasteio.wasteioapi.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/generate-token")
    @PreAuthorize("hasRole('ADMIN')")
    public String generateToken(Authentication authentication) {
        return authService.generateToken(authentication.getName());
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listUsers() {
        return authService.listUsers();
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        authService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tokens")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TokenResponse> listTokens() {
        return authService.listTokens();
    }
}
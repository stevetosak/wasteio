package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.model.User;
import com.tosak.wasteio.wasteioapi.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
        String email = authentication.getName();
        return authService.generateToken(email);
    }
}
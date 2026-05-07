package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.model.User;
import com.tosak.wasteio.wasteioapi.service.AuthService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/generate-token")
    public String generateToken(@RequestBody User admin) {
        return authService.generateToken(admin);
    }
}
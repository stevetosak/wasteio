package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.dto.LoginResponse;
import com.tosak.wasteio.wasteioapi.model.User;
import com.tosak.wasteio.wasteioapi.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public User register(@RequestParam String token,
                         @RequestParam String name,
                         @RequestParam String email,
                         @RequestParam String password) {
        return authService.register(token, name, email, password);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestParam String email,
                               @RequestParam String password) {
        return authService.login(email, password);
    }
}
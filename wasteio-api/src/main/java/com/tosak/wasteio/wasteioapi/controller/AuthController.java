package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.dto.LoginResponse;
import com.tosak.wasteio.wasteioapi.dto.UserResponse;
import com.tosak.wasteio.wasteioapi.model.User;
import com.tosak.wasteio.wasteioapi.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public UserResponse register(@RequestParam String token,
                                 @RequestParam String name,
                                 @RequestParam String email,
                                 @RequestParam String password,
                                 @RequestParam(required = false) String phoneNumber) {
        User user = authService.register(token, name, email, password, phoneNumber);
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getPhoneNumber(), user.getRole());
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestParam String email,
                               @RequestParam String password) {
        return authService.login(email, password);
    }

    // TODO: ne e funkcionalno

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestParam String currentPassword,
            @RequestParam String newPassword,
            @RequestParam String email) {
        authService.changePassword(email, currentPassword, newPassword);
        return ResponseEntity.ok("Password updated");
    }
}

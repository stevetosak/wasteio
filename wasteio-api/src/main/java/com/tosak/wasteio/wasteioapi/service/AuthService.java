package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.model.*;
import com.tosak.wasteio.wasteioapi.repository.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, TokenRepository tokenRepository) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
    }

    // ADMIN -> generate token
    public String generateToken(User admin) {
        String token = UUID.randomUUID().toString();

        RegistrationToken regToken = new RegistrationToken();
        regToken.setToken(token);
        regToken.setUsed(false);
        regToken.setCreatedBy(admin);

        tokenRepository.save(regToken);

        return token;
    }

    // REGISTER EMPLOYEE
    public User register(String token, String name, String email, String password) {

        RegistrationToken regToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (regToken.isUsed()) {
            throw new RuntimeException("Token already used");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(encoder.encode(password));
        user.setRole(Role.EMPLOYEE);

        regToken.setUsed(true);

        tokenRepository.save(regToken);
        return userRepository.save(user);
    }

    // LOGIN
    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Wrong password");
        }

        return user;
    }
}
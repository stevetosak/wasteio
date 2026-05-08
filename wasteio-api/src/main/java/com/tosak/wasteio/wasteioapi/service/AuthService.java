package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.dto.LoginResponse;
import com.tosak.wasteio.wasteioapi.model.*;
import com.tosak.wasteio.wasteioapi.repository.*;
import com.tosak.wasteio.wasteioapi.security.JwtTokenProvider;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final BCryptPasswordEncoder encoder;

    public AuthService(UserRepository userRepository, TokenRepository tokenRepository, JwtTokenProvider jwtTokenProvider, BCryptPasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.encoder = encoder;
    }

    // ADMIN -> generate token
    public String generateToken(String email) {

        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        String token = UUID.randomUUID().toString();

        RegistrationToken regToken = new RegistrationToken();
        regToken.setToken(token);
        regToken.setUsed(false);
        regToken.setCreatedBy(admin);

        tokenRepository.save(regToken);

        return token;
    }

    // REGISTER EMPLOYEE
    @Transactional
    public User register(String token, String name, String email, String password, String phoneNumber) {

        RegistrationToken regToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (regToken.isUsed()) {
            throw new RuntimeException("Token already used");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhoneNumber(phoneNumber);
        user.setPassword(encoder.encode(password));
        user.setRole(Role.EMPLOYEE);

        User savedUser = userRepository.save(user);
        regToken.setUsed(true);
        tokenRepository.save(regToken);
        
        return savedUser;
    }

    // LOGIN
    public LoginResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User Not Found"));
        
        if (!encoder.matches(password, user.getPassword())){
            throw new RuntimeException("Wrong password");
        }
        
        String jwtToken = jwtTokenProvider.generateToken(email);
        
        return new LoginResponse(
                jwtToken,
                user.getEmail(),
                user.getName(),
                user.getRole().toString()
        );
        
    }
}
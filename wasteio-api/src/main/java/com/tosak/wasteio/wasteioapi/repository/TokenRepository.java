package com.tosak.wasteio.wasteioapi.repository;

import com.tosak.wasteio.wasteioapi.model.RegistrationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenRepository extends JpaRepository<RegistrationToken, Long> {
    Optional<RegistrationToken> findByToken(String token);
}
package com.tosak.wasteio.wasteioapi.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "device_registration_tokens")
public class DeviceRegistrationToken {

    @Id
    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "token_hash", nullable = false)
    private String tokenHash;

    @Column(name = "used", nullable = false)
    private boolean used = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;
}
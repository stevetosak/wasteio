package com.tosak.wasteio.wasteioapi.dto;

import com.tosak.wasteio.wasteioapi.model.Role;

public record UserResponse(
        Long id, String name, String email, String phoneNumber, Role role) {}

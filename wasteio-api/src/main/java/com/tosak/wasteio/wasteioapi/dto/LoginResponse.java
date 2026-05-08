package com.tosak.wasteio.wasteioapi.dto;

public record LoginResponse (
        String token,
        String email,
        String name,
        String role
) {}

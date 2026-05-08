package com.tosak.wasteio.wasteioapi.dto;

public record TokenResponse(Long id, String token, boolean used, String createdBy) {}

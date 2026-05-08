package com.tosak.wasteio.wasteioapi.dto;

public record TelemetryEventDTO(String containerId, double fillLevel, double batteryLevel) {}

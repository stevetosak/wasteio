package com.tosak.wasteio.wasteioapi.dto;

import lombok.Data;

@Data
public class SimRegisterRequest {
    private String deviceId;
    private Double latitude;
    private Double longitude;
}

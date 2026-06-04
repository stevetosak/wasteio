package com.tosak.wasteio.wasteioapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProvisionResponse {
    private String deviceId;
    private String registrationToken;
}
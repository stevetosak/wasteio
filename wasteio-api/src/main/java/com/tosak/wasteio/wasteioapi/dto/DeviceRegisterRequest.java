package com.tosak.wasteio.wasteioapi.dto;

import lombok.Data;

@Data
public class DeviceRegisterRequest {
    private String deviceId;
    private String registrationToken;
}
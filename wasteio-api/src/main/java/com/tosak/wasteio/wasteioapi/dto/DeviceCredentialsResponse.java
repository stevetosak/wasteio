package com.tosak.wasteio.wasteioapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DeviceCredentialsResponse {
    private String mqttHost;
    private int mqttPort;
    private String mqttUsername;
    private String mqttPassword;
    private String telemetryTopic;
    private String eventsTopic;
    private String commandsTopic;
}
package com.tosak.wasteio.wasteioapi.mqtt;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TelemetryMessage {

    private String containerId;
    private double fillLevel;
    private double batteryLevel;
    private String timestamp;
    private Location location;
}
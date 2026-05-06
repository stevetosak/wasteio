package com.tosak.wasteio.wasteioapi.mqtt;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TelemetryMessage {

    @JsonProperty("device_id")
    private String deviceId;

    @JsonProperty("fill_level")
    private double fillLevel;

    @JsonProperty("timestamp")
    private String timestamp;
}
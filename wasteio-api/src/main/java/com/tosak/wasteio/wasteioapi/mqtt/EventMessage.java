package com.tosak.wasteio.wasteioapi.mqtt;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class EventMessage {

    @JsonProperty("deviceId")
    private String deviceId;

    @JsonProperty("eventType")
    private String eventType;

    @JsonProperty("fillLevel")
    private Double fillLevel;

    @JsonProperty("timestamp")
    private String timestamp;
}
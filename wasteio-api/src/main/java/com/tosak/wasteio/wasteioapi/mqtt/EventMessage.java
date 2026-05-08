package com.tosak.wasteio.wasteioapi.mqtt;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class EventMessage {

    @JsonProperty("containerId")
    private String containerId;

    @JsonProperty("eventType")
    private String eventType;

    @JsonProperty("fillLevel")
    private Double fillLevel;

    @JsonProperty("timestamp")
    private String timestamp;
}
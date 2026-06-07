package com.tosak.wasteio.wasteioapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimDeviceDTO {
    private String deviceId;
    private String containerId;
    private String containerName;
    private double fillLevel;
    private double batteryLevel;
}

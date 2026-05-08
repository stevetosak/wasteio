package com.tosak.wasteio.wasteioapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulatorConfigDTO {
    private String fillInterval;
    private String batteryInterval;
    private String telemetryInterval;
    private Double fillRateMin;
    private Double fillRateMax;
    private Double batteryDrainMin;
    private Double batteryDrainMax;
}

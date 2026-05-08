package com.tosak.wasteio.wasteioapi.dto;

import com.tosak.wasteio.wasteioapi.model.DeviceStatus;
import com.tosak.wasteio.wasteioapi.model.WasteType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContainerDTO {
    private String id;
    private String name;
    private String address;
    private WasteType wasteType;
    private Integer capacityLiters;
    private Double fillLevel;
    private Double batteryLevel;
    private DeviceStatus status;
    private String lastPickup;
    private LocationDTO location;

    @Data
    @AllArgsConstructor
    public static class LocationDTO {
        private double lat;
        private double lng;
    }
}
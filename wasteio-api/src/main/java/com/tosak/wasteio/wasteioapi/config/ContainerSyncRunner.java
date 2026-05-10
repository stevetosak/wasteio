package com.tosak.wasteio.wasteioapi.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tosak.wasteio.wasteioapi.model.Container;
import com.tosak.wasteio.wasteioapi.model.DeviceStatus;
import com.tosak.wasteio.wasteioapi.model.WasteType;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ContainerSyncRunner implements ApplicationRunner {

    private final ContainerRepository containerRepository;
    private final ObjectMapper objectMapper;

    @Value("${simulator.devices.path}")
    private String devicesFilePath;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        File devicesFile = new File(devicesFilePath);
        if (!devicesFile.exists()) {
            log.warn("Devices file not found at '{}', skipping container sync", devicesFile.getAbsolutePath());
            return;
        }

        List<DeviceRecord> devices = objectMapper.readValue(
                devicesFile,
                objectMapper.getTypeFactory().constructCollectionType(List.class, DeviceRecord.class)
        );

        for (DeviceRecord device : devices) {
            containerRepository.findById(device.getContainerId()).ifPresentOrElse(
                    existing -> {
                        existing.setName(device.getName());
                        existing.setAddress(device.getAddress());
                        existing.setLatitude(device.getLocation().getLat());
                        existing.setLongitude(device.getLocation().getLng());
                        existing.setWasteType(toWasteType(device.getWasteType()));
                        existing.setCapacity(device.getCapacityLiters());
                        existing.setLatestFillLevel(device.getFillLevel() != null ? device.getFillLevel() : 0.0);
                        existing.setDeviceStatus(toDeviceStatus(device.getStatus()));
                        containerRepository.save(existing);
                        log.info("Updated container: {}", device.getContainerId());
                    },
                    () -> {
                        Container container = new Container();
                        container.setId(device.getContainerId());
                        container.setName(device.getName() != null ? device.getName() : toDisplayName(device.getContainerId()));
                        container.setAddress(device.getAddress());
                        container.setLatitude(device.getLocation().getLat());
                        container.setLongitude(device.getLocation().getLng());
                        container.setWasteType(toWasteType(device.getWasteType()));
                        container.setCapacity(device.getCapacityLiters());
                        container.setLatestFillLevel(device.getFillLevel() != null ? device.getFillLevel() : 0.0);
                        container.setDeviceStatus(toDeviceStatus(device.getStatus()));
                        containerRepository.save(container);
                        log.info("Registered new container: {}", device.getContainerId());
                    }
            );
        }
    }

    private WasteType toWasteType(String type) {
        if (type == null) return null;
        return switch (type.toLowerCase()) {
            case "general" -> WasteType.GENERAL;
            case "recycling" -> WasteType.RECYCLABLE;
            case "organic" -> WasteType.ORGANIC;
            case "hazardous" -> WasteType.HAZARDOUS;
            case "glass" -> WasteType.GLASS;
            case "paper" -> WasteType.PAPER;
            case "plastic" -> WasteType.PLASTIC;
            case "electronic" -> WasteType.ELECTRONIC;
            default -> null;
        };
    }

    private DeviceStatus toDeviceStatus(String status) {
        if (status == null) return DeviceStatus.ACTIVE;
        return switch (status.toLowerCase()) {
            case "active" -> DeviceStatus.ACTIVE;
            case "maintenance" -> DeviceStatus.MAINTENANCE;
            case "offline" -> DeviceStatus.OFFLINE;
            default -> DeviceStatus.ACTIVE;
        };
    }

    private String toDisplayName(String containerId) {
        return Arrays.stream(containerId.split("-"))
                .map(part -> Character.toUpperCase(part.charAt(0)) + part.substring(1))
                .collect(java.util.stream.Collectors.joining(" "));
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class DeviceRecord {
        @JsonProperty("containerId")
        private String containerId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("address")
        private String address;

        @JsonProperty("wasteType")
        private String wasteType;

        @JsonProperty("capacityLiters")
        private Integer capacityLiters;

        @JsonProperty("fillLevel")
        private Double fillLevel;

        @JsonProperty("status")
        private String status;

        @JsonProperty("location")
        private LocationRecord location;

        @Data
        static class LocationRecord {
            @JsonProperty("lat")
            private double lat;
            @JsonProperty("lng")
            private double lng;
        }
    }
}

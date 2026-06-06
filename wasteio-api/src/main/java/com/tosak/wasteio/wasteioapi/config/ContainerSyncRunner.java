package com.tosak.wasteio.wasteioapi.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tosak.wasteio.wasteioapi.model.Container;
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
            containerRepository.findById(device.getDeviceId()).ifPresentOrElse(
                    existing -> {
                        existing.setName(device.getName());
                        existing.setAddress(device.getAddress());
                        existing.setLatitude(device.getLocation().getLat());
                        existing.setLongitude(device.getLocation().getLng());
                        existing.setWasteType(toWasteType(device.getWasteType()));
                        existing.setCapacity(device.getCapacityLiters());
                        existing.setLatestFillLevel(device.getFillLevel() != null ? device.getFillLevel() : 0.0);
                        containerRepository.save(existing);
                        log.info("Updated container: {}", device.getDeviceId());
                    },
                    () -> {
                        Container container = new Container();
                        container.setId(device.getDeviceId());
                        container.setName(device.getName() != null ? device.getName() : toDisplayName(device.getDeviceId()));
                        container.setAddress(device.getAddress());
                        container.setLatitude(device.getLocation().getLat());
                        container.setLongitude(device.getLocation().getLng());
                        container.setWasteType(toWasteType(device.getWasteType()));
                        container.setCapacity(device.getCapacityLiters());
                        container.setLatestFillLevel(device.getFillLevel() != null ? device.getFillLevel() : 0.0);
                        containerRepository.save(container);
                        log.info("Registered new container: {}", device.getDeviceId());
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

    private String toDisplayName(String containerId) {
        return Arrays.stream(containerId.split("-"))
                .map(part -> Character.toUpperCase(part.charAt(0)) + part.substring(1))
                .collect(java.util.stream.Collectors.joining(" "));
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class DeviceRecord {
        @JsonProperty("deviceId")
        private String deviceId;

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

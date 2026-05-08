package com.tosak.wasteio.wasteioapi.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tosak.wasteio.wasteioapi.model.Container;
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
import java.util.stream.Collectors;

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
                        existing.setLatitude(device.getLocation().getLat());
                        existing.setLongitude(device.getLocation().getLng());
                        containerRepository.save(existing);
                        log.info("Updated container location: {}", device.getContainerId());
                    },
                    () -> {
                        Container container = new Container();
                        container.setId(device.getContainerId());
                        container.setName(toDisplayName(device.getContainerId()));
                        container.setLatitude(device.getLocation().getLat());
                        container.setLongitude(device.getLocation().getLng());
                        containerRepository.save(container);
                        log.info("Inserted new container: {}", device.getContainerId());
                    }
            );
        }
    }

    private String toDisplayName(String containerId) {
        return Arrays.stream(containerId.split("-"))
                .map(part -> Character.toUpperCase(part.charAt(0)) + part.substring(1))
                .collect(Collectors.joining(" "));
    }

    @Data
    static class DeviceRecord {
        @JsonProperty("containerId")
        private String containerId;
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
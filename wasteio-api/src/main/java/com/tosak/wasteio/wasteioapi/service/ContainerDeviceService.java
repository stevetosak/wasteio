package com.tosak.wasteio.wasteioapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tosak.wasteio.wasteioapi.dto.ContainerDTO;
import com.tosak.wasteio.wasteioapi.dto.FillSnapshotDTO;
import com.tosak.wasteio.wasteioapi.dto.SimDeviceDTO;
import com.tosak.wasteio.wasteioapi.dto.SimulatorConfigDTO;
import com.tosak.wasteio.wasteioapi.model.*;
import com.tosak.wasteio.wasteioapi.mqtt.MosquittoDynsecService;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
import com.tosak.wasteio.wasteioapi.repository.DailyFillSnapshotRepository;
import com.tosak.wasteio.wasteioapi.repository.DeviceRepository;
import com.tosak.wasteio.wasteioapi.repository.PickupRepository;
import com.tosak.wasteio.wasteioapi.repository.TelemetryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class ContainerDeviceService {
    private final ContainerRepository repository;
    private final TelemetryRepository telemetryRepository;
    private final PickupRepository pickupRepository;
    private final DailyFillSnapshotRepository snapshotRepository;
    private final DeviceRepository deviceRepository;
    private final MessageChannel mqttOutboundChannel;
    private final ObjectMapper objectMapper;
    private final MosquittoDynsecService dynsecService;

    public ContainerDeviceService(
            ContainerRepository repository,
            TelemetryRepository telemetryRepository,
            PickupRepository pickupRepository,
            DailyFillSnapshotRepository snapshotRepository,
            DeviceRepository deviceRepository,
            @Qualifier("mqttOutboundChannel") MessageChannel mqttOutboundChannel,
            ObjectMapper objectMapper,
            MosquittoDynsecService dynsecService) {
        this.repository = repository;
        this.telemetryRepository = telemetryRepository;
        this.pickupRepository = pickupRepository;
        this.snapshotRepository = snapshotRepository;
        this.deviceRepository = deviceRepository;
        this.mqttOutboundChannel = mqttOutboundChannel;
        this.objectMapper = objectMapper;
        this.dynsecService = dynsecService;
    }

    public ContainerDTO addDevice(ContainerDTO dto) {
        if (dto.getId() == null || dto.getId().isBlank()) {
            dto.setId(UUID.randomUUID().toString());
        }
        if (repository.existsById(dto.getId())) {
            throw new RuntimeException("Container with id " + dto.getId() + " already exists");
        }
        return toDTO(repository.save(fromDTO(dto)));
    }

    public List<ContainerDTO> getAllDevices() {
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public ContainerDTO getDeviceById(String id) {
        return repository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Container not found: " + id));
    }

    public void deleteDevice(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Container not found: " + id);
        }
        repository.deleteById(id);
    }

    public ContainerDTO updateDevice(String id, ContainerDTO dto) {
        Container container = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Container not found: " + id));
        container.setName(dto.getName());
        container.setAddress(dto.getAddress());
        container.setWasteType(dto.getWasteType());
        container.setCapacity(dto.getCapacityLiters());
        return toDTO(repository.save(container));
    }

    public ContainerDTO requestPickup(String containerId) {
        Container container = repository.findById(containerId)
                .orElseThrow(() -> new RuntimeException("Container not found: " + containerId));

        var devices = deviceRepository.findByContainer_Id(containerId);
        if (devices.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No device assigned to container: " + containerId);
        }
        String deviceId = devices.getFirst().getId();

        Pickup pickup = new Pickup();
        pickup.setContainer(container);
        pickup.setPickup_time(java.time.LocalDateTime.now());
        pickup.setFill_level_before(container.getLatestFillLevel());
        pickupRepository.save(pickup);

        try {
            String topic = "waste/devices/" + deviceId + "/commands";
            Message<?> message = MessageBuilder.withPayload("pickup")
                    .setHeader("mqtt_topic", topic)
                    .build();

            boolean sent = mqttOutboundChannel.send(message);
            if (!sent) {
                log.error("Pickup command was not accepted for container: {}", containerId);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Failed to send pickup command - message rejected by channel");
            }
            log.info("Pickup command sent to device {} for container {}", deviceId, containerId);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to send pickup command for container: {}", containerId, e);
            throw new RuntimeException("Failed to send pickup command", e);
        }

        return toDTO(container);
    }

    public List<FillSnapshotDTO> getFillHistory(String containerId, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days - 1L);
        return snapshotRepository
                .findByContainerIdAndSnapshotDateBetweenOrderBySnapshotDateAsc(containerId, start, end)
                .stream()
                .map(s -> new FillSnapshotDTO(s.getSnapshotDate().toString(), s.getFillLevel()))
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<SimDeviceDTO> listSimDevices() {
        return deviceRepository.findByRegistrationStatus("SIM").stream()
                .filter(device -> device.getContainer() != null)
                .map(device -> {
                    var container = device.getContainer();
                    double batteryLevel = telemetryRepository
                            .findTopByContainerIdOrderByRecordedAtDesc(container.getId())
                            .map(Telemetry::getBatteryLevel)
                            .orElse(0.0);
                    return new SimDeviceDTO(
                            device.getId(),
                            container.getId(),
                            container.getName(),
                            container.getLatestFillLevel(),
                            batteryLevel
                    );
                })
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional
    public int clearOfflineSimDevices() {
        List<com.tosak.wasteio.wasteioapi.model.Device> stale =
                deviceRepository.findByRegistrationStatusAndDeviceStatus("SIM", DeviceStatus.OFFLINE);
        if (stale.isEmpty()) return 0;

        List<String> deviceIds = stale.stream()
                .map(com.tosak.wasteio.wasteioapi.model.Device::getId).toList();
        List<String> containerIds = stale.stream()
                .filter(d -> d.getContainer() != null)
                .map(d -> d.getContainer().getId()).toList();

        // Batch DELETE WHERE id IN (...) — cascades telemetry/pickups/snapshots, nulls device.container_id
        if (!containerIds.isEmpty()) repository.deleteAllByIdInBatch(containerIds);
        // Batch DELETE WHERE device_id IN (...)
        deviceRepository.deleteAllByIdInBatch(deviceIds);
        // Single MQTT message with all delete commands
        dynsecService.deleteDeviceClients(deviceIds);

        log.info("Cleared {} offline sim device(s)", stale.size());
        return stale.size();
    }

    public void pushDeviceConfig(String deviceId, SimulatorConfigDTO config) {
        try {
            String payload = objectMapper.writeValueAsString(config);
            String topic = "waste/devices/" + deviceId + "/config";
            Message<?> message = MessageBuilder.withPayload(payload)
                    .setHeader("mqtt_topic", topic)
                    .build();
            mqttOutboundChannel.send(message);
            log.info("Config pushed to device {} via MQTT", deviceId);
        } catch (Exception e) {
            log.error("Failed to push config to device {}", deviceId, e);
            throw new RuntimeException("Failed to push config to device " + deviceId, e);
        }
    }

    private Container fromDTO(ContainerDTO dto) {
        Container container = new Container();
        container.setId(dto.getId());
        container.setName(dto.getName());
        container.setAddress(dto.getAddress());
        container.setWasteType(dto.getWasteType());
        container.setCapacity(dto.getCapacityLiters());
        if (dto.getLocation() != null) {
            container.setLatitude(dto.getLocation().getLat());
            container.setLongitude(dto.getLocation().getLng());
        }
        return container;
    }

    private ContainerDTO toDTO(Container container) {
        double batteryLevel = telemetryRepository
                .findTopByContainerIdOrderByRecordedAtDesc(container.getId())
                .map(Telemetry::getBatteryLevel)
                .orElse(0.0);

        String lastPickup = pickupRepository
                .findLatestByContainerId(container.getId())
                .map(p -> p.getPickup_time().toString())
                .orElse(null);

        DeviceStatus deviceStatus = deviceRepository.findByContainer_Id(container.getId())
                .stream().findFirst()
                .map(Device::getDeviceStatus)
                .orElse(DeviceStatus.ACTIVE);

        return ContainerDTO.builder()
                .id(container.getId())
                .name(container.getName())
                .address(container.getAddress())
                .wasteType(container.getWasteType())
                .capacityLiters(container.getCapacity())
                .fillLevel(container.getLatestFillLevel())
                .batteryLevel(batteryLevel)
                .status(deviceStatus)
                .lastPickup(lastPickup)
                .location(new ContainerDTO.LocationDTO(container.getLatitude(), container.getLongitude()))
                .build();
    }
}
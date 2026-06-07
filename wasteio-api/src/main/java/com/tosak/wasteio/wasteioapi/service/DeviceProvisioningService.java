package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.dto.DeviceCredentialsResponse;
import com.tosak.wasteio.wasteioapi.dto.SimRegisterRequest;
import com.tosak.wasteio.wasteioapi.model.*;
import com.tosak.wasteio.wasteioapi.mqtt.MosquittoDynsecService;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
import com.tosak.wasteio.wasteioapi.repository.DeviceRegistrationTokenRepository;
import com.tosak.wasteio.wasteioapi.repository.DeviceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
public class DeviceProvisioningService {

    private final DeviceRepository deviceRepository;
    private final DeviceRegistrationTokenRepository tokenRepository;
    private final ContainerRepository containerRepository;
    private final MosquittoDynsecService dynsecService;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${mqtt.broker.host}")
    private String mqttHost;

    @Value("${mqtt.broker.port}")
    private int mqttPort;

    public DeviceProvisioningService(
            DeviceRepository deviceRepository,
            DeviceRegistrationTokenRepository tokenRepository,
            ContainerRepository containerRepository,
            MosquittoDynsecService dynsecService,
            BCryptPasswordEncoder passwordEncoder) {
        this.deviceRepository = deviceRepository;
        this.tokenRepository = tokenRepository;
        this.containerRepository = containerRepository;
        this.dynsecService = dynsecService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String provisionDevice(String deviceId) {
        Device device = deviceRepository.findById(deviceId).orElseGet(() -> {
            Device d = new Device();
            d.setId(deviceId);
            d.setDeviceStatus(DeviceStatus.IDLE);
            d.setRegistrationStatus("PENDING");
            d.setCreatedAt(LocalDateTime.now());
            d.setLastSeenAt(LocalDateTime.now());
            return deviceRepository.save(d);
        });

        if (tokenRepository.existsById(deviceId)) {
            tokenRepository.deleteById(deviceId);
        }

        String plainToken = UUID.randomUUID().toString();

        DeviceRegistrationToken token = new DeviceRegistrationToken();
        token.setDeviceId(deviceId);
        token.setTokenHash(passwordEncoder.encode(plainToken));
        token.setUsed(false);
        token.setCreatedAt(LocalDateTime.now());
        tokenRepository.save(token);

        log.info("Provisioned registration token for device {}", deviceId);
        return plainToken;
    }


    @Transactional
    public DeviceCredentialsResponse simRegisterDevice(SimRegisterRequest request) {
        String deviceId = request.getDeviceId();
        double lat = request.getLatitude() != null ? request.getLatitude() : 0.0;
        double lng = request.getLongitude() != null ? request.getLongitude() : 0.0;

        Device device = getOrCreateDevice(deviceId);
        createDeviceContainerIfNotExists(device,lat,lng);

        String mqttPassword = UUID.randomUUID().toString();
        device.setMqttPasswordHash(passwordEncoder.encode(mqttPassword));
        device.setRegisteredAt(LocalDateTime.now());
        deviceRepository.save(device);

        // upsert so this is idempotent — works on first boot and on credential refresh
        dynsecService.upsertDeviceClient(deviceId, mqttPassword);

        log.info("Sim device {} registered/refreshed", deviceId);

        return new DeviceCredentialsResponse(
                mqttHost, mqttPort, deviceId, mqttPassword,
                "waste/devices/" + deviceId + "/telemetry",
                "waste/devices/" + deviceId + "/events",
                "waste/devices/" + deviceId + "/commands"
        );
    }

    private static final List<Integer> SIM_CAPACITIES = List.of(100, 200, 400, 600, 800);
    private static final WasteType[] SIM_WASTE_TYPES = WasteType.values();
    private static final Random RNG = new Random();

    private void createDeviceContainerIfNotExists(Device device, double lat, double lng) {
        if (device.getContainer() == null) {
            String containerId = "container-" + device.getId();
            Container container = containerRepository.findById(containerId).orElseGet(() -> {
                int capacity = SIM_CAPACITIES.get(RNG.nextInt(SIM_CAPACITIES.size()));
                WasteType wasteType = SIM_WASTE_TYPES[RNG.nextInt(SIM_WASTE_TYPES.length)];
                Container c = new Container();
                c.setId(containerId);
                c.setName(containerId);
                c.setLatitude(lat);
                c.setLongitude(lng);
                c.setLatestFillLevel(0.0);
                c.setAddress("Simulation");
                c.setCapacity(capacity);
                c.setWasteType(wasteType);
                return containerRepository.save(c);
            });
            device.setContainer(container);
        }
    }

    @Transactional
    public DeviceCredentialsResponse registerDevice(String deviceId, String submittedToken) {
        DeviceRegistrationToken tokenRecord = tokenRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No registration token found for device: " + deviceId));

        if (tokenRecord.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration token already used");
        }

        if (!passwordEncoder.matches(submittedToken, tokenRecord.getTokenHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid registration token");
        }

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Device not found: " + deviceId));

        String mqttPassword = UUID.randomUUID().toString();
        device.setMqttPasswordHash(passwordEncoder.encode(mqttPassword));
        device.setRegistrationStatus("REGISTERED");
        device.setRegisteredAt(LocalDateTime.now());
        deviceRepository.save(device);

        tokenRecord.setUsed(true);
        tokenRecord.setRegisteredAt(LocalDateTime.now());
        tokenRepository.save(tokenRecord);

        dynsecService.createDeviceClient(deviceId, mqttPassword);

        log.info("Device {} registered successfully", deviceId);

        return new DeviceCredentialsResponse(
                mqttHost,
                mqttPort,
                deviceId,
                mqttPassword,
                "waste/devices/" + deviceId + "/telemetry",
                "waste/devices/" + deviceId + "/events",
                "waste/devices/" + deviceId + "/commands"
        );
    }

    private Device getOrCreateDevice(String deviceId) {
        Device device = deviceRepository.findById(deviceId).orElse(null);

        if (device == null) {
            device = new Device();
            device.setId(deviceId);
            device.setDeviceStatus(DeviceStatus.IDLE);
            device.setRegistrationStatus("SIM");
            device.setCreatedAt(LocalDateTime.now());
            device.setLastSeenAt(LocalDateTime.now());
        } else {
            device.setRegistrationStatus("SIM");
        }

        return device;
    }
}
package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.dto.DeviceCredentialsResponse;
import com.tosak.wasteio.wasteioapi.model.Device;
import com.tosak.wasteio.wasteioapi.model.DeviceRegistrationToken;
import com.tosak.wasteio.wasteioapi.model.DeviceStatus;
import com.tosak.wasteio.wasteioapi.mqtt.MosquittoDynsecService;
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
import java.util.UUID;

@Slf4j
@Service
public class DeviceProvisioningService {

    private final DeviceRepository deviceRepository;
    private final DeviceRegistrationTokenRepository tokenRepository;
    private final MosquittoDynsecService dynsecService;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${mqtt.broker.host}")
    private String mqttHost;

    @Value("${mqtt.broker.port}")
    private int mqttPort;

    public DeviceProvisioningService(
            DeviceRepository deviceRepository,
            DeviceRegistrationTokenRepository tokenRepository,
            MosquittoDynsecService dynsecService,
            BCryptPasswordEncoder passwordEncoder) {
        this.deviceRepository = deviceRepository;
        this.tokenRepository = tokenRepository;
        this.dynsecService = dynsecService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String provisionDevice(String deviceId) {
        Device device = deviceRepository.findById(deviceId).orElseGet(() -> {
            Device d = new Device();
            d.setId(deviceId);
            d.setDeviceStatus(DeviceStatus.ACTIVE);
            d.setRegistrationStatus("PENDING");
            d.setCreatedAt(LocalDateTime.now());
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
    public DeviceCredentialsResponse simRegisterDevice(String deviceId) {
        Device device = deviceRepository.findById(deviceId).orElse(null);
        String mqttPassword = UUID.randomUUID().toString();

        if (device == null) {
            device = new Device();
            device.setId(deviceId);
            device.setDeviceStatus(DeviceStatus.ACTIVE);
            device.setRegistrationStatus("SIM");
            device.setCreatedAt(LocalDateTime.now());
        } else {
            device.setRegistrationStatus("SIM");
        }

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
}
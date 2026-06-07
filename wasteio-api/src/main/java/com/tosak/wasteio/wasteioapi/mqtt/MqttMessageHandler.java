package com.tosak.wasteio.wasteioapi.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tosak.wasteio.wasteioapi.dto.TelemetryEventDTO;
import com.tosak.wasteio.wasteioapi.model.Pickup;
import com.tosak.wasteio.wasteioapi.model.Telemetry;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
import com.tosak.wasteio.wasteioapi.repository.DeviceRepository;
import com.tosak.wasteio.wasteioapi.repository.PickupRepository;
import com.tosak.wasteio.wasteioapi.repository.TelemetryRepository;
import com.tosak.wasteio.wasteioapi.sse.TelemetryBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class MqttMessageHandler {
    private final ContainerRepository containerRepository;
    private final DeviceRepository deviceRepository;
    private final TelemetryRepository telemetryRepository;
    private final PickupRepository pickupRepository;
    private final TelemetryBroadcaster broadcaster;
    private final ObjectMapper objectMapper;

    @Transactional
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<String> message) {
        try {
            String topic = (String) message.getHeaders().get("mqtt_receivedTopic");
            String deviceId = extractSegment(topic, 2);

            TelemetryMessage telemetry = objectMapper.readValue(message.getPayload(), TelemetryMessage.class);

            deviceRepository.findById(deviceId).ifPresentOrElse(
                    device -> {
                        if (device.getContainer() == null) {
                            log.warn("Device {} has no container assigned, skipping telemetry", deviceId);
                            return;
                        }

                        var container = device.getContainer();
                        double oldLevel = container.getLatestFillLevel();

                        container.setLatestFillLevel(telemetry.getFillLevel());
                        containerRepository.save(container);

                        if (oldLevel != telemetry.getFillLevel()) {
                            broadcaster.broadcast(new TelemetryEventDTO(
                                    container.getId(),
                                    telemetry.getFillLevel(),
                                    telemetry.getBatteryLevel()
                            ));

                            telemetryRepository.save(new Telemetry(
                                    container,
                                    telemetry.getFillLevel(),
                                    telemetry.getBatteryLevel(),
                                    ZonedDateTime.parse(telemetry.getTimestamp()).toLocalDateTime()
                            ));

                            log.info("Device {} updated container {} - fillLevel: {} -> {}",
                                    deviceId, container.getId(), oldLevel, telemetry.getFillLevel());
                        }

                        if (oldLevel - telemetry.getFillLevel() >= 80.0) {
                            log.info("Pickup detected for container {}: fill dropped from {}% to {}%",
                                    container.getId(), oldLevel, telemetry.getFillLevel());

                            Pickup pickup = new Pickup();
                            pickup.setContainer(container);
                            pickup.setPickup_time(ZonedDateTime.parse(telemetry.getTimestamp()).toLocalDateTime());
                            pickup.setFill_level_before(oldLevel);
                            pickupRepository.save(pickup);
                        }
                    },
                    () -> log.warn("Device not found: {}", deviceId)
            );
        } catch (Exception e) {
            log.error("Error while processing MQTT message", e);
        }
    }

    private String extractSegment(String topic, int index) {
        if (topic == null) return "";
        String[] parts = topic.split("/");
        return (index < parts.length) ? parts[index] : "";
    }
}

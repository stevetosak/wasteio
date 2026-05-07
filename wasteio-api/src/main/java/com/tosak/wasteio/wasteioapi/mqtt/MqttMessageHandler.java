package com.tosak.wasteio.wasteioapi.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tosak.wasteio.wasteioapi.model.Pickup;
import com.tosak.wasteio.wasteioapi.model.Telemetry;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
import com.tosak.wasteio.wasteioapi.repository.PickupRepository;
import com.tosak.wasteio.wasteioapi.repository.TelemetryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class MqttMessageHandler {
    private final ContainerRepository containerRepository;
    private final TelemetryRepository telemetryRepository;
    private final PickupRepository pickupRepository;
    
    private final ObjectMapper objectMapper;

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<String> message) {

        try {
            String payload = message.getPayload();
            log.info("Received MQTT message: {}", payload);

            TelemetryMessage telemetry =
                    objectMapper.readValue(payload, TelemetryMessage.class);

            containerRepository.findById(telemetry.getContainerId()).ifPresentOrElse(
                    container -> {

                        double oldLevel = container.getLatestFillLevel();

                        container.setLatestFillLevel(telemetry.getFillLevel());

                        containerRepository.save(container);
                        
                        telemetryRepository.save(
                                new Telemetry(container,
                                        telemetry.getFillLevel(),
                                        telemetry.getBatteryLevel(),
                                        ZonedDateTime.parse(telemetry.getTimestamp()).toLocalDateTime()
                                        )
                        );

                        log.info("Device updated {} - fillLevel: {} -> {}",
                                telemetry.getContainerId(),
                                oldLevel,
                                telemetry.getFillLevel());

                        // Detect pickup: 80%+ drop in fill level
                        if (oldLevel - telemetry.getFillLevel() >= 80.0) {
                            log.info("Pickup detected for container {}: fill dropped from {}% to {}%",
                                    telemetry.getContainerId(),
                                    oldLevel,
                                    telemetry.getFillLevel());
                            
                            Pickup pickup = new Pickup();
                            pickup.setContainer(container);
                            pickup.setPickup_time(ZonedDateTime.parse(telemetry.getTimestamp()).toLocalDateTime());
                            pickup.setFill_level_before(oldLevel);
                            pickupRepository.save(pickup);

                            log.info("Pickup event recorded for container: {}", telemetry.getContainerId());
                        }
                    },
                    () -> log.warn("Device not found: {}",
                            telemetry.getContainerId())
            );

        } catch (Exception e) {
            log.error("Error while processing MQTT message", e);
        }
    }
}
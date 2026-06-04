package com.tosak.wasteio.wasteioapi.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tosak.wasteio.wasteioapi.model.Pickup;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
import com.tosak.wasteio.wasteioapi.repository.DeviceRepository;
import com.tosak.wasteio.wasteioapi.repository.PickupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class MqttEventHandler {

    private final ContainerRepository containerRepository;
    private final DeviceRepository deviceRepository;
    private final PickupRepository pickupRepository;
    private final ObjectMapper objectMapper;

    @ServiceActivator(inputChannel = "mqttEventsChannel")
    public void handleEvent(Message<String> message) {
        try {
            String topic = (String) message.getHeaders().get("mqtt_receivedTopic");
            String deviceId = extractSegment(topic, 2);

            EventMessage event = objectMapper.readValue(message.getPayload(), EventMessage.class);
            log.info("Received event '{}' from device {}", event.getEventType(), deviceId);

            if ("emptied".equals(event.getEventType())) {
                handleEmptied(deviceId, event);
            } else {
                log.warn("Unhandled event type '{}' from device {}", event.getEventType(), deviceId);
            }
        } catch (Exception e) {
            log.error("Error processing event message", e);
        }
    }

    private void handleEmptied(String deviceId, EventMessage event) {
        deviceRepository.findById(deviceId).ifPresentOrElse(
                device -> {
                    if (device.getContainer() == null) {
                        log.warn("Device {} has no container assigned, skipping emptied event", deviceId);
                        return;
                    }

                    var container = device.getContainer();
                    double fillLevelBefore = container.getLatestFillLevel();

                    container.setLatestFillLevel(event.getFillLevel());
                    containerRepository.save(container);

                    Pickup pickup = new Pickup();
                    pickup.setContainer(container);
                    pickup.setPickup_time(ZonedDateTime.parse(event.getTimestamp()).toLocalDateTime());
                    pickup.setFill_level_before(fillLevelBefore);
                    pickupRepository.save(pickup);

                    log.info("Pickup recorded for container {} (fill level: {}% -> {}%)",
                            container.getId(), fillLevelBefore, event.getFillLevel());
                },
                () -> log.warn("Device not found for emptied event: {}", deviceId)
        );
    }

    private String extractSegment(String topic, int index) {
        if (topic == null) return "";
        String[] parts = topic.split("/");
        return (index < parts.length) ? parts[index] : "";
    }
}

package com.tosak.wasteio.wasteioapi.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tosak.wasteio.wasteioapi.model.Pickup;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
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
    private final PickupRepository pickupRepository;
    private final ObjectMapper objectMapper;

    @ServiceActivator(inputChannel = "mqttEventsChannel")
    public void handleEvent(Message<String> message) {
        try {
            EventMessage event = objectMapper.readValue(message.getPayload(), EventMessage.class);
            log.info("Received event '{}' for container {}", event.getEventType(), event.getContainerId());

            if ("emptied".equals(event.getEventType())) {
                handleEmptied(event);
            } else {
                log.warn("Unhandled event type '{}' for container {}", event.getEventType(), event.getContainerId());
            }
        } catch (Exception e) {
            log.error("Error processing event message", e);
        }
    }

    private void handleEmptied(EventMessage event) {
        containerRepository.findById(event.getContainerId()).ifPresentOrElse(
                container -> {
                    double fillLevelBefore = container.getLatestFillLevel();

                    container.setLatestFillLevel(event.getFillLevel());
                    containerRepository.save(container);

                    Pickup pickup = new Pickup();
                    pickup.setContainer(container);
                    pickup.setPickup_time(ZonedDateTime.parse(event.getTimestamp()).toLocalDateTime());
                    pickup.setFill_level_before(fillLevelBefore);
                    pickupRepository.save(pickup);

                    log.info("Pickup recorded for container {} (fill level: {}% -> {}%)",
                            event.getContainerId(), fillLevelBefore, event.getFillLevel());
                },
                () -> log.warn("Container not found for emptied event: {}", event.getContainerId())
        );
    }
}
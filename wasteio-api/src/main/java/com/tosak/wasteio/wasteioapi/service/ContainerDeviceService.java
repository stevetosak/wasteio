package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.model.Container;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
@Slf4j
@Service
public class ContainerDeviceService {
    private final ContainerRepository repository;
    private final MessageChannel mqttOutboundChannel;

    public ContainerDeviceService(ContainerRepository repository, @Qualifier("mqttOutboundChannel") MessageChannel mqttOutboundChannel) {
        this.repository = repository;
        this.mqttOutboundChannel = mqttOutboundChannel;
    }

    public Container addDevice(Container device) {
        if (repository.existsById(device.getId())) {
            throw new RuntimeException("Device with id " + device.getId() + " already exists");
        }
        return repository.save(device);
    }

    public List<Container> getAllDevices() {
        return repository.findAll();
    }

    public Container getDeviceById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Device not found: " + id));
    }

    public void deleteDevice(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Device not found: " + id);
        }
        repository.deleteById(id);
    }

    public Container updateDevice(String id, Container device) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Device not found: " + id);
        }
        device.setId(id);
        return repository.save(device);
    }

    public void requestPickup(String containerId) {

        if (!repository.existsById(containerId)) {
            throw new RuntimeException("Device not found: " + containerId);
        }
        
        try {
            String topic = "waste/containers/" + containerId + "/commands";
            Message<?> message = MessageBuilder.withPayload("pickup")
                    .setHeader("mqtt_topic", topic)
                    .build();
            
            boolean sent = mqttOutboundChannel.send(message);

            if (!sent) {
                log.error("Pickup command was not accepted for container: {}", containerId);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Failed to send pickup command - message rejected by channel");
            }

            log.info("Pickup command sent for container: {}", containerId);
        } catch (Exception e) {
            log.error("Failed to send pickup command for container: {}", containerId, e);
            throw new RuntimeException("Failed to send pickup command", e);
        }
    }
    
}
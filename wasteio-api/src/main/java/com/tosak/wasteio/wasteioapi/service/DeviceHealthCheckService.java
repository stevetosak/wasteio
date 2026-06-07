package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.model.DeviceStatus;
import com.tosak.wasteio.wasteioapi.repository.DeviceRepository;
import com.tosak.wasteio.wasteioapi.sse.TelemetryBroadcaster;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
public class DeviceHealthCheckService {

    private final DeviceRepository deviceRepository;
    private final MessageChannel mqttOutboundChannel;
    private final TelemetryBroadcaster broadcaster;

    @Value("${device.healthcheck.interval.ms:15000}")
    private long intervalMs;

    public DeviceHealthCheckService(
            DeviceRepository deviceRepository,
            @Qualifier("mqttOutboundChannel") MessageChannel mqttOutboundChannel,
            TelemetryBroadcaster broadcaster) {
        this.deviceRepository = deviceRepository;
        this.mqttOutboundChannel = mqttOutboundChannel;
        this.broadcaster = broadcaster;
    }

    public void runHealthCheck() {
        markStaleDevices();
        sendPings();
    }

    private void markStaleDevices() {
        LocalDateTime threshold = LocalDateTime.now().minusNanos(intervalMs * 2 * 1_000_000L);
        deviceRepository.findAll().stream()
                .filter(d -> d.getDeviceStatus() != DeviceStatus.MAINTENANCE)
                .filter(d -> d.getLastSeenAt() != null && d.getLastSeenAt().isBefore(threshold))
                .filter(d -> d.getDeviceStatus() != DeviceStatus.OFFLINE)
                .forEach(d -> {
                    d.setDeviceStatus(DeviceStatus.OFFLINE);
                    deviceRepository.save(d);
                    if (d.getContainer() != null) {
                        broadcaster.broadcastStatus(d.getContainer().getId(), "OFFLINE");
                    }
                    log.info("Device {} marked OFFLINE (no healthcheck-ack within {}ms)", d.getId(), intervalMs * 2);
                });
    }

    private void sendPings() {
        deviceRepository.findAll().stream()
                .filter(d -> d.getDeviceStatus() != DeviceStatus.MAINTENANCE)
                .filter(d -> d.getMqttPasswordHash() != null)
                .forEach(d -> {
                    String topic = "waste/devices/" + d.getId() + "/commands";
                    mqttOutboundChannel.send(
                            MessageBuilder.withPayload("healthcheck")
                                    .setHeader("mqtt_topic", topic)
                                    .build()
                    );
                });
        log.debug("Health check pings sent");
    }
}

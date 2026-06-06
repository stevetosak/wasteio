package com.tosak.wasteio.wasteioapi.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class MosquittoDynsecService {

    private static final String DYNSEC_TOPIC = "$CONTROL/dynamic-security/v1";

    private final MessageChannel mqttOutboundChannel;
    private final ObjectMapper objectMapper;

    public MosquittoDynsecService(
            @Qualifier("mqttOutboundChannel") MessageChannel mqttOutboundChannel,
            ObjectMapper objectMapper) {
        this.mqttOutboundChannel = mqttOutboundChannel;
        this.objectMapper = objectMapper;
    }

    public void createDeviceClient(String deviceId, String plainPassword) {
        String roleName = "device-" + deviceId + "-role";

        Map<String, Object> createRole = Map.of(
                "command", "createRole",
                "rolename", roleName,
                "acls", List.of(
                        Map.of("acltype", "publishClientSend",
                                "topic", "waste/devices/" + deviceId + "/telemetry",
                                "allow", true),
                        Map.of("acltype", "publishClientSend",
                                "topic", "waste/devices/" + deviceId + "/events",
                                "allow", true),
                        Map.of("acltype", "subscribeLiteral",
                                "topic", "waste/devices/" + deviceId + "/commands",
                                "allow", true)
                )
        );

        Map<String, Object> createClient = Map.of(
                "command", "createClient",
                "username", deviceId,
                "password", plainPassword,
                "roles", List.of(Map.of("rolename", roleName, "priority", -1))
        );

        publish(Map.of("commands", List.of(createRole, createClient)));
        log.info("Dynsec: created client and role for device {}", deviceId);
    }

    public void deleteDeviceClient(String deviceId) {
        String roleName = "device-" + deviceId + "-role";

        Map<String, Object> deleteClient = Map.of("command", "deleteClient", "username", deviceId);
        Map<String, Object> deleteRole = Map.of("command", "deleteRole", "rolename", roleName);

        publish(Map.of("commands", List.of(deleteClient, deleteRole)));
        log.info("Dynsec: deleted client and role for device {}", deviceId);
    }

    // Delete-then-recreate so it works whether the client already exists or not.
    // Used by the sim registration path where credentials may need to be refreshed.
    public void upsertDeviceClient(String deviceId, String plainPassword) {
        String roleName = "device-" + deviceId + "-role";

        Map<String, Object> deleteClient = Map.of("command", "deleteClient", "username", deviceId);
        Map<String, Object> deleteRole = Map.of("command", "deleteRole", "rolename", roleName);
        Map<String, Object> createRole = Map.of(
                "command", "createRole",
                "rolename", roleName,
                "acls", List.of(
                        Map.of("acltype", "publishClientSend",
                                "topic", "waste/devices/" + deviceId + "/telemetry",
                                "allow", true),
                        Map.of("acltype", "publishClientSend",
                                "topic", "waste/devices/" + deviceId + "/events",
                                "allow", true),
                        Map.of("acltype", "subscribeLiteral",
                                "topic", "waste/devices/" + deviceId + "/commands",
                                "allow", true)
                )
        );
        Map<String, Object> createClient = Map.of(
                "command", "createClient",
                "username", deviceId,
                "password", plainPassword,
                "roles", List.of(Map.of("rolename", roleName, "priority", -1))
        );

        publish(Map.of("commands", List.of(deleteClient, deleteRole, createRole, createClient)));
        log.info("Dynsec: upserted client and role for device {}", deviceId);
    }

    private void publish(Map<String, Object> payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            mqttOutboundChannel.send(
                    MessageBuilder.withPayload(json)
                            .setHeader("mqtt_topic", DYNSEC_TOPIC)
                            .setHeader("mqtt_qos", 1)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to publish dynsec command", e);
            throw new RuntimeException("Dynsec command failed", e);
        }
    }
}

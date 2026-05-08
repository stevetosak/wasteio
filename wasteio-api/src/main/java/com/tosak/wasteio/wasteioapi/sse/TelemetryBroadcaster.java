package com.tosak.wasteio.wasteioapi.sse;

import com.tosak.wasteio.wasteioapi.dto.TelemetryEventDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class TelemetryBroadcaster {

    // One SseEmitter per open browser connection. CopyOnWriteArrayList lets the
    // MQTT thread iterate safely while HTTP threads add/remove concurrently.
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter register() {
        // Long.MAX_VALUE = no server-side timeout. The browser's EventSource
        // reconnects automatically if the connection ever drops anyway.
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        emitters.add(emitter);
        log.debug("SSE client connected ({} active)", emitters.size());

        // Clean up when the client disconnects or times out
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        return emitter;
    }

    public void broadcast(TelemetryEventDTO event) {
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().data(event));
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        if (!dead.isEmpty()) {
            emitters.removeAll(dead);
        }
    }
}

package com.tosak.wasteio.wasteioapi.sse;

import com.tosak.wasteio.wasteioapi.dto.TelemetryEventDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class TelemetryBroadcaster {

    private static final int MAX_CLIENTS = 200;
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter register() {
        if (emitters.size() >= MAX_CLIENTS) {
            // Reject early — caller should return 503
            throw new IllegalStateException("SSE client limit reached");
        }

        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);
        log.debug("SSE client connected ({} active)", emitters.size());

        Runnable cleanup = () -> {
            emitters.remove(emitter);
            log.debug("SSE client removed ({} active)", emitters.size());
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        // Send an immediate "connected" comment so the client's onopen fires
        // even before the first real event, and to flush any proxy buffers.
        try {
            emitter.send(SseEmitter.event().comment("connected"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcast(TelemetryEventDTO event) {
        if (emitters.isEmpty()) return;

        List<SseEmitter> dead = new ArrayList<>();
        SseEmitter.SseEventBuilder built = SseEmitter.event()
                .id(String.valueOf(System.currentTimeMillis())) // enables Last-Event-ID
                .name("telemetry")
                .data(event);

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(built);
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        if (!dead.isEmpty()) {
            emitters.removeAll(dead);
            log.debug("Removed {} dead emitters", dead.size());
        }
    }
}

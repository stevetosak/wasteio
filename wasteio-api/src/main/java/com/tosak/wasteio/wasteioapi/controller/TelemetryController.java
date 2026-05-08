package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.sse.TelemetryBroadcaster;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/telemetry")
@CrossOrigin(origins = "*")
public class TelemetryController {

    private final TelemetryBroadcaster broadcaster;

    public TelemetryController(TelemetryBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    // The browser hits this endpoint once. Spring keeps the connection open
    // and the returned SseEmitter is used to push data whenever we call broadcast().
    @GetMapping("/stream")
    public SseEmitter stream() {
        return broadcaster.register();
    }
}

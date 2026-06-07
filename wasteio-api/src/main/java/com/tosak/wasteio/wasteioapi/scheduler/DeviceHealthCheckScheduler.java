package com.tosak.wasteio.wasteioapi.scheduler;

import com.tosak.wasteio.wasteioapi.service.DeviceHealthCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DeviceHealthCheckScheduler {

    private final DeviceHealthCheckService healthCheckService;

    @Scheduled(
            fixedDelayString = "${device.healthcheck.interval.ms:15000}",
            initialDelayString = "${device.healthcheck.initial-delay.ms:5000}"
    )
    public void run() {
        healthCheckService.runHealthCheck();
    }
}

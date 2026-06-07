package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.dto.DeviceCredentialsResponse;
import com.tosak.wasteio.wasteioapi.dto.DeviceRegisterRequest;
import com.tosak.wasteio.wasteioapi.service.DeviceProvisioningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceRegistrationController {

    private final DeviceProvisioningService deviceProvisioningService;

    @PostMapping("/register")
    public ResponseEntity<DeviceCredentialsResponse> register(@RequestBody DeviceRegisterRequest request) {
        DeviceCredentialsResponse credentials = deviceProvisioningService.registerDevice(
                request.getDeviceId(), request.getRegistrationToken());
        return ResponseEntity.ok(credentials);
    }
}

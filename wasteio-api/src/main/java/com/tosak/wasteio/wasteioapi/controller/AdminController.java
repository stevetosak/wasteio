package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.dto.DeviceCredentialsResponse;
import com.tosak.wasteio.wasteioapi.dto.ProvisionRequest;
import com.tosak.wasteio.wasteioapi.dto.ProvisionResponse;
import com.tosak.wasteio.wasteioapi.dto.SimDeviceDTO;
import com.tosak.wasteio.wasteioapi.dto.SimRegisterRequest;
import com.tosak.wasteio.wasteioapi.dto.SimulatorConfigDTO;
import com.tosak.wasteio.wasteioapi.dto.TokenResponse;
import com.tosak.wasteio.wasteioapi.dto.UserResponse;
import com.tosak.wasteio.wasteioapi.service.AuthService;
import com.tosak.wasteio.wasteioapi.service.ContainerDeviceService;
import com.tosak.wasteio.wasteioapi.service.DeviceHealthCheckService;
import com.tosak.wasteio.wasteioapi.service.DeviceProvisioningService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AuthService authService;
    private final DeviceProvisioningService deviceProvisioningService;
    private final ContainerDeviceService containerDeviceService;
    private final DeviceHealthCheckService healthCheckService;

    public AdminController(AuthService authService, DeviceProvisioningService deviceProvisioningService,
                           ContainerDeviceService containerDeviceService,
                           DeviceHealthCheckService healthCheckService) {
        this.authService = authService;
        this.deviceProvisioningService = deviceProvisioningService;
        this.containerDeviceService = containerDeviceService;
        this.healthCheckService = healthCheckService;
    }

    @PostMapping("/generate-token")
    @PreAuthorize("hasRole('ADMIN')")
    public String generateToken(Authentication authentication) {
        return authService.generateToken(authentication.getName());
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listUsers() {
        return authService.listUsers();
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        authService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tokens")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TokenResponse> listTokens() {
        return authService.listTokens();
    }

    @PostMapping("/devices/provision")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProvisionResponse> provisionDevice(@RequestBody ProvisionRequest request) {
        String token = deviceProvisioningService.provisionDevice(request.getDeviceId());
        return ResponseEntity.ok(new ProvisionResponse(request.getDeviceId(), token));
    }

    @PostMapping("/devices/sim-register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DeviceCredentialsResponse> simRegisterDevice(@RequestBody SimRegisterRequest request) {
        DeviceCredentialsResponse credentials = deviceProvisioningService.simRegisterDevice(request);
        return ResponseEntity.ok(credentials);
    }

    @GetMapping("/devices/sim")
    @PreAuthorize("hasRole('ADMIN')")
    public List<SimDeviceDTO> listSimDevices() {
        return containerDeviceService.listSimDevices();
    }

    @PostMapping("/devices/{deviceId}/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> pushDeviceConfig(@PathVariable String deviceId,
                                                  @RequestBody SimulatorConfigDTO config) {
        containerDeviceService.pushDeviceConfig(deviceId, config);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/devices/healthcheck")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void triggerHealthCheck() {
        healthCheckService.runHealthCheck();
    }
}
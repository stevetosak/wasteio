package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.dto.SimulatorConfigDTO;
import com.tosak.wasteio.wasteioapi.service.SimulatorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulator")
@CrossOrigin(origins = "*")
public class SimulatorController {

    private final SimulatorService service;

    public SimulatorController(SimulatorService service) {
        this.service = service;
    }

    @GetMapping("/config")
    public ResponseEntity<SimulatorConfigDTO> getConfig() {
        return ResponseEntity.ok(service.getConfig());
    }

    @PutMapping("/config")
    public ResponseEntity<SimulatorConfigDTO> updateConfig(@RequestBody SimulatorConfigDTO config) {
        return ResponseEntity.ok(service.updateConfig(config));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e) {
        return ResponseEntity.status(503).body("Simulator unavailable: " + e.getMessage());
    }
}

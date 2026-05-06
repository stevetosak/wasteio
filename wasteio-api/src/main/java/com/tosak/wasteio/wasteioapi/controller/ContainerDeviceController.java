package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.model.Container;
import com.tosak.wasteio.wasteioapi.service.ContainerDeviceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = "*")
public class ContainerDeviceController {
    private final ContainerDeviceService service;

    public ContainerDeviceController(ContainerDeviceService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Container> addDevice(@RequestBody Container device) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addDevice(device));
    }

    @GetMapping
    public ResponseEntity<List<Container>> getAll() {
        return ResponseEntity.ok(service.getAllDevices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Container> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getDeviceById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Container> update(@PathVariable String id,
                                            @RequestBody Container device) {
        return ResponseEntity.ok(service.updateDevice(id, device));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.deleteDevice(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleException(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }
}
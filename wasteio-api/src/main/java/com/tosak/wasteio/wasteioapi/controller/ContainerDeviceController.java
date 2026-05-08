package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.dto.ContainerDTO;
import com.tosak.wasteio.wasteioapi.dto.FillSnapshotDTO;
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
    public ResponseEntity<ContainerDTO> addDevice(@RequestBody ContainerDTO device) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addDevice(device));
    }

    @GetMapping
    public ResponseEntity<List<ContainerDTO>> getAll() {
        return ResponseEntity.ok(service.getAllDevices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContainerDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getDeviceById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContainerDTO> update(@PathVariable String id,
                                               @RequestBody ContainerDTO device) {
        return ResponseEntity.ok(service.updateDevice(id, device));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.deleteDevice(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/pickup")
    public ResponseEntity<ContainerDTO> requestPickup(@PathVariable String id) {
        return ResponseEntity.ok(service.requestPickup(id));
    }

    @GetMapping("/{id}/fill-history")
    public ResponseEntity<List<FillSnapshotDTO>> getFillHistory(
            @PathVariable String id,
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(service.getFillHistory(id, days));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleException(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }
}
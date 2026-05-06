package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.model.ContainerDevice;
import com.tosak.wasteio.wasteioapi.repository.ContainerDeviceRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ContainerDeviceService {
    private final ContainerDeviceRepository repository;

    public ContainerDeviceService(ContainerDeviceRepository repository) {
        this.repository = repository;
    }

    public ContainerDevice addDevice(ContainerDevice device) {
        if (repository.existsById(device.getId())) {
            throw new RuntimeException("Device with id " + device.getId() + " already exists");
        }
        return repository.save(device);
    }

    public List<ContainerDevice> getAllDevices() {
        return repository.findAll();
    }

    public ContainerDevice getDeviceById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Device not found: " + id));
    }

    public void deleteDevice(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Device not found: " + id);
        }
        repository.deleteById(id);
    }

    public ContainerDevice updateDevice(String id, ContainerDevice device) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Device not found: " + id);
        }
        device.setId(id);
        return repository.save(device);
    }
}
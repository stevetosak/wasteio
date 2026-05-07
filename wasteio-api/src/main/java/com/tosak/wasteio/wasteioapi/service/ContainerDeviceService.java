package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.model.Container;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ContainerDeviceService {
    private final ContainerRepository repository;

    public ContainerDeviceService(ContainerRepository repository) {
        this.repository = repository;
    }

    public Container addDevice(Container device) {
        if (repository.existsById(device.getId())) {
            throw new RuntimeException("Device with id " + device.getId() + " already exists");
        }
        return repository.save(device);
    }

    public List<Container> getAllDevices() {
        return repository.findAll();
    }

    public Container getDeviceById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Device not found: " + id));
    }

    public void deleteDevice(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Device not found: " + id);
        }
        repository.deleteById(id);
    }

    public Container updateDevice(String id, Container device) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Device not found: " + id);
        }
        device.setId(id);
        return repository.save(device);
    }
}
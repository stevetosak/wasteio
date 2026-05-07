package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.model.Telemetry;
import com.tosak.wasteio.wasteioapi.repository.TelemetryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;

    public TelemetryService(TelemetryRepository telemetryRepository) {
        this.telemetryRepository = telemetryRepository;
    }

    // CREATE
    public Telemetry save(Telemetry telemetry) {
        return telemetryRepository.save(telemetry);
    }

    // READ - Get by ID
    public Optional<Telemetry> findById(Long id) {
        return telemetryRepository.findById(id);
    }

    // READ - Get all
    public List<Telemetry> findAll() {
        return telemetryRepository.findAll();
    }
    

    // DELETE
    public void delete(Long id) {
        telemetryRepository.deleteById(id);
    }


}
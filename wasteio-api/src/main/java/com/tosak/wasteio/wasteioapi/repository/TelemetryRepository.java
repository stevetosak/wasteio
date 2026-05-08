package com.tosak.wasteio.wasteioapi.repository;

import com.tosak.wasteio.wasteioapi.model.Telemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TelemetryRepository extends JpaRepository<Telemetry, Long> {
    Optional<Telemetry> findTopByContainerIdOrderByRecordedAtDesc(String containerId);
}
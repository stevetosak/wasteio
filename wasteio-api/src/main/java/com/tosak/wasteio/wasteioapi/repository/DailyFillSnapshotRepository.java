package com.tosak.wasteio.wasteioapi.repository;

import com.tosak.wasteio.wasteioapi.model.DailyFillSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyFillSnapshotRepository extends JpaRepository<DailyFillSnapshot, Long> {

    List<DailyFillSnapshot> findByContainerIdAndSnapshotDateBetweenOrderBySnapshotDateAsc(
            String containerId, LocalDate start, LocalDate end);

    Optional<DailyFillSnapshot> findByContainerIdAndSnapshotDate(String containerId, LocalDate date);
}

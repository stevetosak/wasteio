package com.tosak.wasteio.wasteioapi.repository;

import com.tosak.wasteio.wasteioapi.model.Pickup;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PickupRepository extends JpaRepository<Pickup, Long> {
    @Query("SELECT p FROM Pickup p WHERE p.container.id = :containerId ORDER BY p.pickup_time DESC LIMIT 1")
    Optional<Pickup> findLatestByContainerId(@Param("containerId") String containerId);
}
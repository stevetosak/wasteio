package com.tosak.wasteio.wasteioapi.repository;

import com.tosak.wasteio.wasteioapi.model.DeviceRegistrationToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRegistrationTokenRepository extends JpaRepository<DeviceRegistrationToken, String> {
}
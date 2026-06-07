package com.tosak.wasteio.wasteioapi.repository;

import com.tosak.wasteio.wasteioapi.model.Device;
import com.tosak.wasteio.wasteioapi.model.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, String> {
    List<Device> findByContainer_Id(String containerId);
    List<Device> findByRegistrationStatus(String registrationStatus);
    List<Device> findByRegistrationStatusAndDeviceStatus(String registrationStatus, DeviceStatus deviceStatus);
}
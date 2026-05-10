package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.dto.AlertsDTO;

import java.util.List;

public interface AlertsService {
    List<AlertsDTO> getAlerts();
}
package com.tosak.wasteio.wasteioapi.controller;

import com.tosak.wasteio.wasteioapi.dto.AlertsDTO;
import com.tosak.wasteio.wasteioapi.service.AlertsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AlertsController {

    private final AlertsService alertsService;

    @GetMapping
    public List<AlertsDTO> getAlerts() {
        return alertsService.getAlerts();
    }
}
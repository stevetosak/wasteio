package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.dto.AlertsDTO;
import com.tosak.wasteio.wasteioapi.model.Container;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertsServiceImpl implements AlertsService {

    private final ContainerRepository containerRepository;

    @Override
    public List<AlertsDTO> getAlerts() {

        List<Container> containers = containerRepository.findAll();

        return containers.stream()
                .map(c -> {

                    double fill = c.getLatestFillLevel();

                    if (fill >= 90) {
                        return new AlertsDTO(
                                c.getId(),
                                "Critical overflow",
                                "Critical",
                                c.getAddress()
                        );
                    }

                    if (fill >= 70) {
                        return new AlertsDTO(
                                c.getId(),
                                "Warning: container almost full",
                                "Warning",
                                c.getAddress()
                        );
                    }

                    return null;
                })
                .filter(a -> a != null)
                .toList();
    }
}
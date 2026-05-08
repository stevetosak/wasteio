package com.tosak.wasteio.wasteioapi.service;

import com.tosak.wasteio.wasteioapi.dto.SimulatorConfigDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SimulatorService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${simulator.control.url:http://localhost:8090}")
    private String simulatorUrl;

    public SimulatorConfigDTO getConfig() {
        return restTemplate.getForObject(simulatorUrl + "/config", SimulatorConfigDTO.class);
    }

    public SimulatorConfigDTO updateConfig(SimulatorConfigDTO config) {
        HttpEntity<SimulatorConfigDTO> request = new HttpEntity<>(config,
                new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }});
        return restTemplate.exchange(simulatorUrl + "/config", HttpMethod.PUT, request, SimulatorConfigDTO.class).getBody();
    }
}

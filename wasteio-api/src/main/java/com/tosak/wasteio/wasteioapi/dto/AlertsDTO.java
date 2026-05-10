package com.tosak.wasteio.wasteioapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AlertsDTO {
    private String id;
    private String title;
    private String badge;
    private String location;
}
package com.tosak.wasteio.wasteioapi.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
@Entity
@Data
public class ContainerDevice {
    @Id
    private String id;

    private String name;
    private double longitude;
    private double latitude;
    private double fillLevel = 0.0;
}
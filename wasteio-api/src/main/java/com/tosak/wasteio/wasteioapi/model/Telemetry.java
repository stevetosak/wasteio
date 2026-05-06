package com.tosak.wasteio.wasteioapi.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name="telemetry")
@NoArgsConstructor
public class Telemetry {

    public Telemetry(Container container, Double fillLevel, Double batteryLevel, LocalDateTime recordedAt) {
        this.container = container;
        this.fillLevel = fillLevel;
        this.batteryLevel = batteryLevel;
        this.recordedAt = recordedAt;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "telemetry_id", nullable = false, unique = true )
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "container_id", nullable = false, unique = true)
    private Container container;
    
    @Column(name = "fill_level", nullable = false )
    private Double fillLevel;
    
    @Column(name = "battery_level", nullable = false)
    private Double batteryLevel;
    
    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
    
    
}

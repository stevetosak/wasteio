package com.tosak.wasteio.wasteioapi.model;


import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "pickups")
public class Pickup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "container_id", nullable = false)
    private Container container;
    
    @Column(name = "pickup_time", nullable = false)
    private LocalDateTime pickup_time;
    
    @Column(name = "fill_level_before")
    private Double fill_level_before;
    
    
    
}

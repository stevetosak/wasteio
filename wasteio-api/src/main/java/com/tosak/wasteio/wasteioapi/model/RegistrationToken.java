package com.tosak.wasteio.wasteioapi.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
public class RegistrationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String token;

    private boolean used;

    @ManyToOne
    @JoinColumn(name = "created_by_id")
    private User createdBy; // admin
}
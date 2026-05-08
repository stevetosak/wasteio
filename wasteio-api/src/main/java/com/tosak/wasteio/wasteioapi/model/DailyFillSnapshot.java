package com.tosak.wasteio.wasteioapi.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "daily_fill_snapshots",
        uniqueConstraints = @UniqueConstraint(columnNames = {"container_id", "snapshot_date"}))
public class DailyFillSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "container_id", nullable = false)
    private Container container;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "fill_level", nullable = false)
    private Double fillLevel;
}

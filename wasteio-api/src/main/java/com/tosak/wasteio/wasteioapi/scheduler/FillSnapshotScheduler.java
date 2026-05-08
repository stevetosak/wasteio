package com.tosak.wasteio.wasteioapi.scheduler;

import com.tosak.wasteio.wasteioapi.model.DailyFillSnapshot;
import com.tosak.wasteio.wasteioapi.repository.ContainerRepository;
import com.tosak.wasteio.wasteioapi.repository.DailyFillSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class FillSnapshotScheduler {

    private final ContainerRepository containerRepository;
    private final DailyFillSnapshotRepository snapshotRepository;

    @Scheduled(cron = "0 0 22 * * *")
    public void snapshotFillLevels() {
        LocalDate today = LocalDate.now();
        var containers = containerRepository.findAll();

        for (var container : containers) {
            var existing = snapshotRepository.findByContainerIdAndSnapshotDate(container.getId(), today);
            if (existing.isPresent()) {
                existing.get().setFillLevel(container.getLatestFillLevel());
                snapshotRepository.save(existing.get());
            } else {
                var snapshot = new DailyFillSnapshot();
                snapshot.setContainer(container);
                snapshot.setSnapshotDate(today);
                snapshot.setFillLevel(container.getLatestFillLevel());
                snapshotRepository.save(snapshot);
            }
        }

        log.info("Daily fill snapshot taken for {} containers on {}", containers.size(), today);
    }
}

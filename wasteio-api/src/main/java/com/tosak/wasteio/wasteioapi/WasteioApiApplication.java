package com.tosak.wasteio.wasteioapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WasteioApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(WasteioApiApplication.class, args);
    }

}

package com.slashpad;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SlashPadApplication {

    public static void main(String[] args) {
        SpringApplication.run(SlashPadApplication.class, args);
    }

}

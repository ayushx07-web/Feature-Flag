package com.featureflags;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableCaching
@EnableJpaAuditing
@EnableAsync
public class FeatureFlagApplication {
    public static void main(String[] args) {
        SpringApplication.run(FeatureFlagApplication.class, args);
    }
}

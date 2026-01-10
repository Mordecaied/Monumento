package com.monumento;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class MonumentoApplication {

    public static void main(String[] args) {
        SpringApplication.run(MonumentoApplication.class, args);
    }
}

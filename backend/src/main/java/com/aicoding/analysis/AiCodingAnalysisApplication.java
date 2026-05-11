package com.aicoding.analysis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@ConfigurationPropertiesScan
@MapperScan("com.aicoding.analysis.mapper")
public class AiCodingAnalysisApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiCodingAnalysisApplication.class, args);
    }
}

package br.com.jrdtech.taskflow.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class TestMailConfig {

    @Bean
    @Primary
    public CapturingMailService capturingMailService() {
        return new CapturingMailService();
    }
}

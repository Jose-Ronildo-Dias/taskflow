package br.com.jrdtech.taskflow.config;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @DefaultValue("http://localhost:5173") String publicUrl,
        @DefaultValue Cors cors,
        @DefaultValue Mail mail,
        @DefaultValue PasswordReset passwordReset,
        @DefaultValue RateLimit rateLimit,
        @DefaultValue Security security) {

    public record Cors(@DefaultValue List<String> allowedOrigins) {
    }

    public record Mail(
            @DefaultValue("false") boolean enabled,
            @DefaultValue("false") boolean logLinks,
            @DefaultValue("no-reply@taskflow.local") String from) {
    }

    public record PasswordReset(@DefaultValue("PT1H") Duration tokenTtl) {
    }

    public record RateLimit(@DefaultValue("true") boolean enabled) {
    }

    public record Security(@DefaultValue("12") int bcryptStrength) {
    }
}

package br.com.jrdtech.taskflow.config;

import br.com.jrdtech.taskflow.common.JsonErrorWriter;
import br.com.jrdtech.taskflow.common.RateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Limita, por IP, as requisições POST aos endpoints públicos mais sensíveis a abuso. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private record Rule(String path, int max, Duration window) {
    }

    private static final List<Rule> RULES = List.of(
            new Rule("/api/v1/auth/login", 30, Duration.ofMinutes(5)),
            new Rule("/api/v1/auth/register", 10, Duration.ofHours(1)),
            new Rule("/api/v1/auth/forgot-password", 5, Duration.ofHours(1)),
            new Rule("/api/v1/auth/reset-password", 10, Duration.ofHours(1)));

    private final RateLimiter limiter = new RateLimiter();
    private final AppProperties properties;
    private final JsonErrorWriter errors;
    private final Clock clock;

    public RateLimitFilter(AppProperties properties, JsonErrorWriter errors, Clock clock) {
        this.properties = properties;
        this.errors = errors;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !properties.rateLimit().enabled()
                || !"POST".equals(request.getMethod())
                || RULES.stream().noneMatch(rule -> rule.path().equals(request.getRequestURI()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Rule rule = RULES.stream().filter(r -> r.path().equals(request.getRequestURI())).findFirst().orElseThrow();
        String key = rule.path() + '|' + request.getRemoteAddr();
        long retryAfter = limiter.tryAcquire(key, rule.max(), rule.window().toMillis(), clock.millis());
        if (retryAfter > 0) {
            response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfter));
            errors.write(request, response, HttpStatus.TOO_MANY_REQUESTS,
                    "Muitas requisições. Aguarde alguns instantes e tente novamente.");
            return;
        }
        chain.doFilter(request, response);
    }
}

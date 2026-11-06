package br.com.jrdtech.taskflow.auth;

import br.com.jrdtech.taskflow.common.Exceptions.TooManyRequestsException;
import br.com.jrdtech.taskflow.common.RateLimiter;
import java.time.Clock;
import java.time.Duration;
import org.springframework.stereotype.Service;

/**
 * Bloqueia temporariamente a combinação IP + e-mail após falhas consecutivas de login.
 * A chave inclui o IP para que um terceiro não consiga bloquear a conta de outra pessoa.
 */
@Service
public class LoginAttemptService {

    static final int MAX_FAILURES = 5;
    static final Duration WINDOW = Duration.ofMinutes(15);

    private final RateLimiter limiter = new RateLimiter();
    private final Clock clock;

    public LoginAttemptService(Clock clock) {
        this.clock = clock;
    }

    public void checkAllowed(String ip, String email) {
        long retry = limiter.retryAfterSeconds(key(ip, email), MAX_FAILURES, WINDOW.toMillis(), now());
        if (retry > 0) {
            throw new TooManyRequestsException("Muitas tentativas de login. Tente novamente em alguns minutos.", retry);
        }
    }

    public void recordFailure(String ip, String email) {
        limiter.tryAcquire(key(ip, email), MAX_FAILURES, WINDOW.toMillis(), now());
    }

    public void reset(String ip, String email) {
        limiter.reset(key(ip, email));
    }

    private long now() {
        return clock.millis();
    }

    private static String key(String ip, String email) {
        return ip + '|' + email;
    }
}

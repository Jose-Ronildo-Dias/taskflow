package br.com.jrdtech.taskflow.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RateLimiterTest {

    private static final long WINDOW = 60_000;

    @Test
    void permiteAteOLimiteEBloqueiaDepois() {
        RateLimiter limiter = new RateLimiter();
        for (int i = 0; i < 3; i++) {
            assertThat(limiter.tryAcquire("k", 3, WINDOW, 1_000)).isZero();
        }
        assertThat(limiter.tryAcquire("k", 3, WINDOW, 1_000)).isPositive();
    }

    @Test
    void informaOTempoRestanteDaJanela() {
        RateLimiter limiter = new RateLimiter();
        limiter.tryAcquire("k", 1, WINDOW, 0);

        assertThat(limiter.tryAcquire("k", 1, WINDOW, 10_000)).isEqualTo(50);
    }

    @Test
    void reabreQuandoAJanelaExpira() {
        RateLimiter limiter = new RateLimiter();
        limiter.tryAcquire("k", 1, WINDOW, 0);
        assertThat(limiter.tryAcquire("k", 1, WINDOW, 1)).isPositive();

        assertThat(limiter.tryAcquire("k", 1, WINDOW, WINDOW)).isZero();
    }

    @Test
    void chavesDiferentesNaoSeInterferem() {
        RateLimiter limiter = new RateLimiter();
        limiter.tryAcquire("a", 1, WINDOW, 0);

        assertThat(limiter.tryAcquire("a", 1, WINDOW, 1)).isPositive();
        assertThat(limiter.tryAcquire("b", 1, WINDOW, 1)).isZero();
    }

    @Test
    void consultaNaoConsomeTentativas() {
        RateLimiter limiter = new RateLimiter();
        limiter.tryAcquire("k", 2, WINDOW, 0);

        assertThat(limiter.retryAfterSeconds("k", 2, WINDOW, 1)).isZero();
        assertThat(limiter.retryAfterSeconds("k", 2, WINDOW, 1)).isZero();
        assertThat(limiter.tryAcquire("k", 2, WINDOW, 1)).isZero();
        assertThat(limiter.retryAfterSeconds("k", 2, WINDOW, 2)).isPositive();
    }

    @Test
    void resetLiberaAChave() {
        RateLimiter limiter = new RateLimiter();
        limiter.tryAcquire("k", 1, WINDOW, 0);
        limiter.reset("k");

        assertThat(limiter.tryAcquire("k", 1, WINDOW, 1)).isZero();
    }
}

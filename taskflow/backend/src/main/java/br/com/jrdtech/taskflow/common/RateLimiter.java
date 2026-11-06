package br.com.jrdtech.taskflow.common;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Limitador de janela fixa em memória. Vale por instância da aplicação; com várias réplicas
 * cada uma mantém seu próprio contador (limitação documentada em docs/SECURITY.md).
 */
public class RateLimiter {

    private static final int CLEANUP_THRESHOLD = 10_000;

    private record Window(long startMillis, int count) {
    }

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    /**
     * Registra uma tentativa e devolve 0 se permitida, ou os segundos restantes até a janela reabrir.
     */
    public long tryAcquire(String key, int max, long windowMillis, long nowMillis) {
        if (windows.size() > CLEANUP_THRESHOLD) {
            windows.entrySet().removeIf(e -> nowMillis - e.getValue().startMillis() >= windowMillis);
        }
        long[] retry = {0};
        windows.compute(key, (k, current) -> {
            if (current == null || nowMillis - current.startMillis() >= windowMillis) {
                return new Window(nowMillis, 1);
            }
            if (current.count() >= max) {
                retry[0] = Math.max(1, (windowMillis - (nowMillis - current.startMillis()) + 999) / 1000);
                return current;
            }
            return new Window(current.startMillis(), current.count() + 1);
        });
        return retry[0];
    }

    /** Apenas consulta, sem consumir tentativa. */
    public long retryAfterSeconds(String key, int max, long windowMillis, long nowMillis) {
        Window current = windows.get(key);
        if (current == null || nowMillis - current.startMillis() >= windowMillis || current.count() < max) {
            return 0;
        }
        return Math.max(1, (windowMillis - (nowMillis - current.startMillis()) + 999) / 1000);
    }

    public void reset(String key) {
        windows.remove(key);
    }
}

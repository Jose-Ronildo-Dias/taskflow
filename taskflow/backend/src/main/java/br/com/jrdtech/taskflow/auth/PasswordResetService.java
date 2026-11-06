package br.com.jrdtech.taskflow.auth;

import br.com.jrdtech.taskflow.common.EmailNormalizer;
import br.com.jrdtech.taskflow.common.Exceptions.InvalidRequestException;
import br.com.jrdtech.taskflow.config.AppProperties;
import br.com.jrdtech.taskflow.user.User;
import br.com.jrdtech.taskflow.user.UserRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    static final String INVALID_TOKEN = "O link de recuperação é inválido ou expirou. Solicite um novo.";

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final UserSessionService sessions;
    private final AppProperties properties;
    private final Clock clock;

    public PasswordResetService(UserRepository users, PasswordResetTokenRepository tokens,
                                PasswordEncoder passwordEncoder, MailService mailService,
                                UserSessionService sessions, AppProperties properties, Clock clock) {
        this.users = users;
        this.tokens = tokens;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
        this.sessions = sessions;
        this.properties = properties;
        this.clock = clock;
    }

    /**
     * Gera o token e dispara o e-mail. Não informa se o e-mail existe: o chamador sempre responde da mesma forma.
     * Apenas o hash SHA-256 do token é persistido.
     */
    @Transactional
    public void requestReset(String rawEmail) {
        String email = EmailNormalizer.normalize(rawEmail);
        User user = users.findByEmail(email).filter(User::isEnabled).orElse(null);
        if (user == null) {
            return;
        }
        tokens.deleteAllByUser(user.getId());

        String token = TokenHasher.newToken();
        Instant now = Instant.now(clock);
        tokens.save(new PasswordResetToken(user.getId(), TokenHasher.sha256Hex(token), now,
                now.plus(properties.passwordReset().tokenTtl())));

        String link = properties.publicUrl() + "/reset-password?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
        mailService.sendPasswordReset(user.getEmail(), user.getName(), link);
    }

    /** Troca a senha, consome o token de uso único e encerra todas as sessões do usuário. */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        Instant now = Instant.now(clock);
        PasswordResetToken stored = tokens.findByTokenHash(TokenHasher.sha256Hex(token))
                .orElseThrow(() -> new InvalidRequestException("token", INVALID_TOKEN));
        if (tokens.consume(stored.getId(), now) == 0) {
            throw new InvalidRequestException("token", INVALID_TOKEN);
        }
        User user = users.findById(stored.getUserId())
                .orElseThrow(() -> new InvalidRequestException("token", INVALID_TOKEN));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        tokens.deleteAllByUser(user.getId());
        sessions.invalidateAll(user.getEmail(), null);
    }

    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void purgeExpiredTokens() {
        int removed = tokens.deleteExpiredBefore(Instant.now(clock).minus(Duration.ofDays(1)));
        if (removed > 0) {
            log.info("{} tokens de recuperação expirados removidos", removed);
        }
    }
}

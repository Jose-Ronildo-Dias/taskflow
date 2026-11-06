package br.com.jrdtech.taskflow.auth;

import java.util.Map;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.stereotype.Service;

/** Revogação de sessões no armazenamento (PostgreSQL), indexadas pelo e-mail do usuário. */
@Service
public class UserSessionService {

    private final FindByIndexNameSessionRepository<? extends Session> sessions;

    public UserSessionService(FindByIndexNameSessionRepository<? extends Session> sessions) {
        this.sessions = sessions;
    }

    /** Remove todas as sessões do usuário, exceto {@code keepSessionId} (pode ser nulo). */
    public void invalidateAll(String email, String keepSessionId) {
        Map<String, ? extends Session> found = sessions.findByPrincipalName(email);
        for (String sessionId : found.keySet()) {
            if (!sessionId.equals(keepSessionId)) {
                sessions.deleteById(sessionId);
            }
        }
    }
}

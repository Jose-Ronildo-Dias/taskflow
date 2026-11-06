package br.com.jrdtech.taskflow.user;

import br.com.jrdtech.taskflow.auth.UserSessionService;
import br.com.jrdtech.taskflow.common.Exceptions.InvalidRequestException;
import br.com.jrdtech.taskflow.common.Exceptions.NotFoundException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final UserSessionService sessions;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder, UserSessionService sessions) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
    }

    @Transactional(readOnly = true)
    public User getById(UUID id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
    }

    @Transactional
    public User updateName(UUID id, String name) {
        User user = getById(id);
        user.setName(name.trim());
        return user;
    }

    /** Troca a senha e encerra todas as outras sessões do usuário, mantendo a atual. */
    @Transactional
    public void changePassword(UUID id, String currentPassword, String newPassword, String currentSessionId) {
        User user = getById(id);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new InvalidRequestException("currentPassword", "A senha atual está incorreta.");
        }
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new InvalidRequestException("newPassword", "A nova senha deve ser diferente da atual.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        sessions.invalidateAll(user.getEmail(), currentSessionId);
    }

    /** Exclusão definitiva: tarefas, categorias e tokens são removidos em cascata pelo banco. */
    @Transactional
    public void deleteAccount(UUID id, String password) {
        User user = getById(id);
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new InvalidRequestException("password", "A senha informada está incorreta.");
        }
        String email = user.getEmail();
        users.delete(user);
        users.flush();
        sessions.invalidateAll(email, null);
        log.info("Conta {} excluída", id);
    }
}

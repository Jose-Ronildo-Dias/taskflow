package br.com.jrdtech.taskflow.auth;

import br.com.jrdtech.taskflow.user.User;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Identidade guardada na sessão. O hash da senha é {@code transient}: existe apenas durante a
 * autenticação e nunca é gravado na tabela de sessões.
 */
public class UserPrincipal implements UserDetails {

    private static final long serialVersionUID = 1L;

    private final UUID id;
    private final String email;
    private final String role;
    private final boolean enabled;
    private final transient String passwordHash;

    private UserPrincipal(UUID id, String email, String role, boolean enabled, String passwordHash) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.enabled = enabled;
        this.passwordHash = passwordHash;
    }

    public static UserPrincipal from(User user) {
        return new UserPrincipal(user.getId(), user.getEmail(), user.getRole().name(), user.isEnabled(),
                user.getPasswordHash());
    }

    public UUID getId() {
        return id;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}

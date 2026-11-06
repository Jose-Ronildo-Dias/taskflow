package br.com.jrdtech.taskflow.auth;

import br.com.jrdtech.taskflow.auth.AuthDtos.LoginRequest;
import br.com.jrdtech.taskflow.auth.AuthDtos.RegisterRequest;
import br.com.jrdtech.taskflow.common.EmailNormalizer;
import br.com.jrdtech.taskflow.common.Exceptions.ConflictException;
import br.com.jrdtech.taskflow.common.Exceptions.InvalidRequestException;
import br.com.jrdtech.taskflow.user.User;
import br.com.jrdtech.taskflow.user.UserDtos.UserResponse;
import br.com.jrdtech.taskflow.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    static final String INVALID_CREDENTIALS = "E-mail ou senha inválidos.";

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final LoginAttemptService loginAttempts;
    private final SecurityContextHolderStrategy contextStrategy = SecurityContextHolder.getContextHolderStrategy();

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       SecurityContextRepository securityContextRepository, LoginAttemptService loginAttempts) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.loginAttempts = loginAttempts;
    }

    /** Cria a conta (sempre com papel USER) e já inicia a sessão. */
    @Transactional
    public UserResponse register(RegisterRequest request, HttpServletRequest http, HttpServletResponse response) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new InvalidRequestException("confirmPassword", "A confirmação não confere com a senha.");
        }
        String email = EmailNormalizer.normalize(request.email());
        if (users.existsByEmail(email)) {
            throw new ConflictException("Já existe uma conta cadastrada com este e-mail.");
        }
        User user = new User(request.name().trim(), email, passwordEncoder.encode(request.password()));
        try {
            users.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Já existe uma conta cadastrada com este e-mail.");
        }
        UserPrincipal principal = UserPrincipal.from(user);
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(principal, null,
                principal.getAuthorities());
        establishSession(authentication, http, response);
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest request, HttpServletRequest http, HttpServletResponse response) {
        String email = EmailNormalizer.normalize(request.email());
        String ip = http.getRemoteAddr();
        loginAttempts.checkAllowed(ip, email);

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));
        } catch (AuthenticationException e) {
            loginAttempts.recordFailure(ip, email);
            throw new BadCredentialsException(INVALID_CREDENTIALS);
        }
        loginAttempts.reset(ip, email);
        establishSession(authentication, http, response);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return UserResponse.from(users.findById(principal.getId()).orElseThrow());
    }

    /** Troca o identificador da sessão (anti session fixation) e persiste o contexto de segurança. */
    private void establishSession(Authentication authentication, HttpServletRequest http,
                                  HttpServletResponse response) {
        SecurityContext context = contextStrategy.createEmptyContext();
        context.setAuthentication(authentication);
        contextStrategy.setContext(context);
        if (http.getSession(false) != null) {
            http.changeSessionId();
        }
        securityContextRepository.saveContext(context, http, response);
    }
}

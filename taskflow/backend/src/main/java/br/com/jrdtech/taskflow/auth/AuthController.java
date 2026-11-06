package br.com.jrdtech.taskflow.auth;

import br.com.jrdtech.taskflow.auth.AuthDtos.ForgotPasswordRequest;
import br.com.jrdtech.taskflow.auth.AuthDtos.LoginRequest;
import br.com.jrdtech.taskflow.auth.AuthDtos.MessageResponse;
import br.com.jrdtech.taskflow.auth.AuthDtos.RegisterRequest;
import br.com.jrdtech.taskflow.auth.AuthDtos.ResetPasswordRequest;
import br.com.jrdtech.taskflow.user.UserDtos.UserResponse;
import br.com.jrdtech.taskflow.user.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticação")
public class AuthController {

    private static final String FORGOT_MESSAGE =
            "Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.";

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final UserService userService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService,
                          UserService userService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.userService = userService;
    }

    /** Apenas garante que o cookie XSRF-TOKEN foi emitido antes de a primeira requisição de escrita. */
    @GetMapping("/csrf")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void csrf() {
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request, HttpServletRequest http,
                                 HttpServletResponse response) {
        return authService.register(request, http, response);
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http,
                              HttpServletResponse response) {
        return authService.login(request, http, response);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return UserResponse.from(userService.getById(principal.getId()));
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.email());
        return new MessageResponse(FORGOT_MESSAGE);
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
    }
}

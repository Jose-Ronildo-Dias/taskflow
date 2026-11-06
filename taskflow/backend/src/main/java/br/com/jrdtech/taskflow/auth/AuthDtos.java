package br.com.jrdtech.taskflow.auth;

import br.com.jrdtech.taskflow.common.ValidPassword;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Informe seu nome completo.")
            @Size(min = 2, max = 120, message = "O nome deve ter de 2 a 120 caracteres.")
            String name,
            @NotBlank(message = "Informe seu e-mail.")
            @Email(message = "Informe um e-mail válido.")
            @Size(max = 254, message = "O e-mail deve ter no máximo 254 caracteres.")
            String email,
            @NotBlank(message = "Informe uma senha.")
            @ValidPassword
            String password,
            @NotBlank(message = "Confirme a senha.")
            String confirmPassword,
            @AssertTrue(message = "É necessário aceitar os termos de uso e a política de privacidade.")
            boolean acceptTerms) {
    }

    public record LoginRequest(
            @NotBlank(message = "Informe seu e-mail.")
            @Size(max = 254, message = "E-mail inválido.")
            String email,
            @NotBlank(message = "Informe sua senha.")
            @Size(max = 128, message = "Senha inválida.")
            String password) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Informe seu e-mail.")
            @Email(message = "Informe um e-mail válido.")
            @Size(max = 254, message = "O e-mail deve ter no máximo 254 caracteres.")
            String email) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Token ausente.")
            @Size(max = 200, message = "Token inválido.")
            String token,
            @NotBlank(message = "Informe a nova senha.")
            @ValidPassword
            String newPassword) {
    }

    public record MessageResponse(String message) {
    }
}

package br.com.jrdtech.taskflow.user;

import br.com.jrdtech.taskflow.common.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class UserDtos {

    private UserDtos() {
    }

    public record UserResponse(UUID id, String name, String email, Role role, Instant createdAt) {

        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt());
        }
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "Informe o nome.")
            @Size(min = 2, max = 120, message = "O nome deve ter de 2 a 120 caracteres.")
            String name) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "Informe a senha atual.")
            @Size(max = 128, message = "Senha atual inválida.")
            String currentPassword,
            @NotBlank(message = "Informe a nova senha.")
            @ValidPassword
            String newPassword) {
    }

    public record DeleteAccountRequest(
            @NotBlank(message = "Informe a senha para confirmar a exclusão.")
            @Size(max = 128, message = "Senha inválida.")
            String password) {
    }
}

package br.com.jrdtech.taskflow.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class CategoryDtos {

    private CategoryDtos() {
    }

    public record CategoryRequest(
            @NotBlank(message = "Informe o nome da categoria.")
            @Size(max = 60, message = "O nome deve ter no máximo 60 caracteres.")
            String name,
            @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "A cor deve estar no formato #RRGGBB.")
            String color) {
    }

    public record CategoryResponse(UUID id, String name, String color, long taskCount, Instant createdAt,
                                   Instant updatedAt) {

        public static CategoryResponse from(Category category, long taskCount) {
            return new CategoryResponse(category.getId(), category.getName(), category.getColor(), taskCount,
                    category.getCreatedAt(), category.getUpdatedAt());
        }
    }

    public record CategorySummary(UUID id, String name, String color) {

        public static CategorySummary from(Category category) {
            return category == null ? null
                    : new CategorySummary(category.getId(), category.getName(), category.getColor());
        }
    }
}

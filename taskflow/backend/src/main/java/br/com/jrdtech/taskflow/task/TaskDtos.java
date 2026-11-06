package br.com.jrdtech.taskflow.task;

import br.com.jrdtech.taskflow.category.CategoryDtos.CategorySummary;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class TaskDtos {

    private TaskDtos() {
    }

    public record TaskRequest(
            @NotBlank(message = "Informe o título da tarefa.")
            @Size(max = 150, message = "O título deve ter no máximo 150 caracteres.")
            String title,
            @Size(max = 2000, message = "A descrição deve ter no máximo 2000 caracteres.")
            String description,
            @NotNull(message = "Informe o status.")
            TaskStatus status,
            @NotNull(message = "Informe a prioridade.")
            TaskPriority priority,
            UUID categoryId,
            Instant dueAt) {
    }

    public record TaskStatusRequest(@NotNull(message = "Informe o status.") TaskStatus status) {
    }

    public record TaskResponse(
            UUID id,
            String title,
            String description,
            TaskStatus status,
            TaskPriority priority,
            Instant dueAt,
            Instant completedAt,
            Instant createdAt,
            Instant updatedAt,
            boolean overdue,
            CategorySummary category) {

        public static TaskResponse from(Task task, Instant now) {
            return new TaskResponse(
                    task.getId(),
                    task.getTitle(),
                    task.getDescription(),
                    task.getStatus(),
                    task.getPriority(),
                    task.getDueAt(),
                    task.getCompletedAt(),
                    task.getCreatedAt(),
                    task.getUpdatedAt(),
                    task.isOverdueAt(now),
                    CategorySummary.from(task.getCategory()));
        }
    }

    /** Filtros da listagem. Todos os campos são opcionais. */
    public record TaskFilter(
            String q,
            TaskStatus status,
            TaskPriority priority,
            UUID categoryId,
            boolean withoutCategory,
            boolean overdue,
            boolean noDueDate,
            Instant dueFrom,
            Instant dueTo) {
    }
}

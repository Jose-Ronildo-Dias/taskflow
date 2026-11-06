package br.com.jrdtech.taskflow.task;

import br.com.jrdtech.taskflow.category.Category;
import br.com.jrdtech.taskflow.category.CategoryRepository;
import br.com.jrdtech.taskflow.common.Exceptions.InvalidRequestException;
import br.com.jrdtech.taskflow.common.Exceptions.NotFoundException;
import br.com.jrdtech.taskflow.common.PageResponse;
import br.com.jrdtech.taskflow.task.TaskDtos.TaskFilter;
import br.com.jrdtech.taskflow.task.TaskDtos.TaskRequest;
import br.com.jrdtech.taskflow.task.TaskDtos.TaskResponse;
import br.com.jrdtech.taskflow.task.TaskSpecifications.SortField;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

    public static final int MAX_PAGE_SIZE = 100;

    private final TaskRepository tasks;
    private final CategoryRepository categories;
    private final Clock clock;

    public TaskService(TaskRepository tasks, CategoryRepository categories, Clock clock) {
        this.tasks = tasks;
        this.categories = categories;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> list(UUID userId, TaskFilter filter, int page, int size, String sort,
                                           String direction) {
        if (page < 0) {
            throw new InvalidRequestException("page", "A página deve ser maior ou igual a zero.");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new InvalidRequestException("size", "O tamanho da página deve estar entre 1 e " + MAX_PAGE_SIZE + ".");
        }
        SortField sortField = parseSort(sort);
        boolean ascending = parseDirection(direction, sortField);
        Instant now = Instant.now(clock);

        Page<Task> result = tasks.findAll(
                TaskSpecifications.search(userId, filter, now, sortField, ascending),
                PageRequest.of(page, size));
        return PageResponse.from(result, task -> TaskResponse.from(task, now));
    }

    @Transactional(readOnly = true)
    public TaskResponse get(UUID userId, UUID id) {
        return TaskResponse.from(find(userId, id), Instant.now(clock));
    }

    @Transactional
    public TaskResponse create(UUID userId, TaskRequest request) {
        Instant now = Instant.now(clock);
        Task task = new Task(userId);
        apply(task, userId, request, now);
        Task saved = tasks.saveAndFlush(task);
        return TaskResponse.from(saved, now);
    }

    @Transactional
    public TaskResponse update(UUID userId, UUID id, TaskRequest request) {
        Instant now = Instant.now(clock);
        Task task = find(userId, id);
        apply(task, userId, request, now);
        tasks.flush();
        return TaskResponse.from(task, now);
    }

    @Transactional
    public TaskResponse changeStatus(UUID userId, UUID id, TaskStatus status) {
        Instant now = Instant.now(clock);
        Task task = find(userId, id);
        task.applyStatus(status, now);
        tasks.flush();
        return TaskResponse.from(task, now);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        Task task = find(userId, id);
        tasks.delete(task);
        tasks.flush();
    }

    private Task find(UUID userId, UUID id) {
        return tasks.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Tarefa não encontrada."));
    }

    private void apply(Task task, UUID userId, TaskRequest request, Instant now) {
        task.setTitle(request.title().trim());
        String description = request.description() == null ? null : request.description().trim();
        task.setDescription(description == null || description.isEmpty() ? null : description);
        task.setPriority(request.priority());
        task.setDueAt(request.dueAt());
        task.setCategory(resolveCategory(userId, request.categoryId()));
        task.applyStatus(request.status(), now);
    }

    /** A categoria só é aceita se pertencer ao mesmo usuário; caso contrário, é tratada como inexistente. */
    private Category resolveCategory(UUID userId, UUID categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categories.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new NotFoundException("Categoria não encontrada."));
    }

    private SortField parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return SortField.CREATED_AT;
        }
        return switch (sort) {
            case "createdAt" -> SortField.CREATED_AT;
            case "dueAt" -> SortField.DUE_AT;
            case "priority" -> SortField.PRIORITY;
            case "title" -> SortField.TITLE;
            default -> throw new InvalidRequestException("sort",
                    "Ordenação inválida. Use createdAt, dueAt, priority ou title.");
        };
    }

    private boolean parseDirection(String direction, SortField sortField) {
        if (direction == null || direction.isBlank()) {
            return sortField == SortField.DUE_AT || sortField == SortField.TITLE;
        }
        return switch (direction.toLowerCase(Locale.ROOT)) {
            case "asc" -> true;
            case "desc" -> false;
            default -> throw new InvalidRequestException("direction", "Direção inválida. Use asc ou desc.");
        };
    }
}

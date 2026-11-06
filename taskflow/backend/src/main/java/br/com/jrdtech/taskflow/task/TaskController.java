package br.com.jrdtech.taskflow.task;

import br.com.jrdtech.taskflow.auth.UserPrincipal;
import br.com.jrdtech.taskflow.common.PageResponse;
import br.com.jrdtech.taskflow.task.TaskDtos.TaskFilter;
import br.com.jrdtech.taskflow.task.TaskDtos.TaskRequest;
import br.com.jrdtech.taskflow.task.TaskDtos.TaskResponse;
import br.com.jrdtech.taskflow.task.TaskDtos.TaskStatusRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tasks")
@Tag(name = "Tarefas")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<TaskResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "false") boolean withoutCategory,
            @RequestParam(defaultValue = "false") boolean overdue,
            @RequestParam(defaultValue = "false") boolean noDueDate,
            @RequestParam(required = false) Instant dueFrom,
            @RequestParam(required = false) Instant dueTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String direction) {
        TaskFilter filter = new TaskFilter(q, status, priority, categoryId, withoutCategory, overdue, noDueDate,
                dueFrom, dueTo);
        return service.list(principal.getId(), filter, page, size, sort, direction);
    }

    @GetMapping("/{id}")
    public TaskResponse get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return service.get(principal.getId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@AuthenticationPrincipal UserPrincipal principal,
                               @Valid @RequestBody TaskRequest request) {
        return service.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public TaskResponse update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                               @Valid @RequestBody TaskRequest request) {
        return service.update(principal.getId(), id, request);
    }

    @PatchMapping("/{id}/status")
    public TaskResponse changeStatus(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                     @Valid @RequestBody TaskStatusRequest request) {
        return service.changeStatus(principal.getId(), id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        service.delete(principal.getId(), id);
    }
}

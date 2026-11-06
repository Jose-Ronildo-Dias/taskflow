package br.com.jrdtech.taskflow.dashboard;

import br.com.jrdtech.taskflow.task.TaskDtos.TaskResponse;
import br.com.jrdtech.taskflow.task.TaskPriority;
import br.com.jrdtech.taskflow.task.TaskRepository;
import br.com.jrdtech.taskflow.task.TaskStatus;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de contagem (todas restritas ao usuário autenticado):
 * <ul>
 *   <li>pendentes = status TODO; em andamento = IN_PROGRESS; concluídas = DONE;</li>
 *   <li>atrasadas = não concluídas com vencimento anterior a agora;</li>
 *   <li>vencimento próximo = não concluídas com vencimento entre agora e as próximas 48 horas.</li>
 * </ul>
 * Atrasadas e vencimento próximo são recortes sobrepostos aos status; tarefas concluídas nunca entram neles.
 */
@Service
public class DashboardService {

    public static final Duration DUE_SOON_WINDOW = Duration.ofHours(48);
    private static final int LIST_SIZE = 5;

    private final TaskRepository tasks;
    private final Clock clock;

    public DashboardService(TaskRepository tasks, Clock clock) {
        this.tasks = tasks;
        this.clock = clock;
    }

    public record Summary(
            long total,
            long todo,
            long inProgress,
            long done,
            long overdue,
            long dueSoon,
            List<TaskResponse> priorityTasks,
            List<TaskResponse> deadlineTasks) {
    }

    @Transactional(readOnly = true)
    public Summary summary(UUID userId) {
        Instant now = Instant.now(clock);
        Instant soonLimit = now.plus(DUE_SOON_WINDOW);
        PageRequest firstPage = PageRequest.of(0, LIST_SIZE);

        return new Summary(
                tasks.countByUserId(userId),
                tasks.countByUserIdAndStatus(userId, TaskStatus.TODO),
                tasks.countByUserIdAndStatus(userId, TaskStatus.IN_PROGRESS),
                tasks.countByUserIdAndStatus(userId, TaskStatus.DONE),
                tasks.countByUserIdAndStatusNotAndDueAtBefore(userId, TaskStatus.DONE, now),
                tasks.countByUserIdAndStatusNotAndDueAtBetween(userId, TaskStatus.DONE, now, soonLimit),
                tasks.findPendingByPriorities(userId, TaskStatus.DONE,
                                List.of(TaskPriority.URGENT, TaskPriority.HIGH), firstPage).stream()
                        .map(t -> TaskResponse.from(t, now)).toList(),
                tasks.findPendingWithDeadline(userId, TaskStatus.DONE, firstPage).stream()
                        .map(t -> TaskResponse.from(t, now)).toList());
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> recentTasks(UUID userId) {
        Instant now = Instant.now(clock);
        return tasks.findTop5ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(t -> TaskResponse.from(t, now))
                .toList();
    }
}

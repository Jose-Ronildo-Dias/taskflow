package br.com.jrdtech.taskflow.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.com.jrdtech.taskflow.task.TaskRepository;
import br.com.jrdtech.taskflow.task.TaskStatus;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-27T12:00:00Z");
    private static final UUID USER = UUID.randomUUID();

    @Mock
    private TaskRepository tasks;

    private DashboardService service() {
        return new DashboardService(tasks, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void usaJanelaDe48HorasEExcluiConcluidasDasContagensDePrazo() {
        when(tasks.countByUserId(USER)).thenReturn(10L);
        when(tasks.countByUserIdAndStatus(USER, TaskStatus.TODO)).thenReturn(4L);
        when(tasks.countByUserIdAndStatus(USER, TaskStatus.IN_PROGRESS)).thenReturn(3L);
        when(tasks.countByUserIdAndStatus(USER, TaskStatus.DONE)).thenReturn(3L);
        when(tasks.countByUserIdAndStatusNotAndDueAtBefore(USER, TaskStatus.DONE, NOW)).thenReturn(2L);
        when(tasks.countByUserIdAndStatusNotAndDueAtBetween(USER, TaskStatus.DONE, NOW, NOW.plusSeconds(48 * 3600)))
                .thenReturn(1L);
        when(tasks.findPendingByPriorities(eq(USER), eq(TaskStatus.DONE), any(), any())).thenReturn(List.of());
        when(tasks.findPendingWithDeadline(eq(USER), eq(TaskStatus.DONE), any())).thenReturn(List.of());

        DashboardService.Summary summary = service().summary(USER);

        assertThat(summary.total()).isEqualTo(10);
        assertThat(summary.todo()).isEqualTo(4);
        assertThat(summary.inProgress()).isEqualTo(3);
        assertThat(summary.done()).isEqualTo(3);
        assertThat(summary.overdue()).isEqualTo(2);
        assertThat(summary.dueSoon()).isEqualTo(1);
        assertThat(summary.todo() + summary.inProgress() + summary.done()).isEqualTo(summary.total());
    }

    @Test
    void todasAsConsultasSaoFeitasParaOUsuarioAutenticado() {
        when(tasks.findTop5ByUserIdOrderByCreatedAtDesc(USER)).thenReturn(List.of());

        assertThat(service().recentTasks(USER)).isEmpty();

        verify(tasks).findTop5ByUserIdOrderByCreatedAtDesc(USER);
    }
}

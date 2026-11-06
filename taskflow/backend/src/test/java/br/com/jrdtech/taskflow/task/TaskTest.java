package br.com.jrdtech.taskflow.task;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class TaskTest {

    private static final Instant NOW = Instant.parse("2026-10-27T12:00:00Z");

    private Task newTask() {
        return new Task(UUID.randomUUID());
    }

    @Test
    void concluirRegistraDataDeConclusao() {
        Task task = newTask();
        task.applyStatus(TaskStatus.DONE, NOW);

        assertThat(task.getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(task.getCompletedAt()).isEqualTo(NOW);
    }

    @Test
    void concluirNovamenteNaoAlteraADataOriginal() {
        Task task = newTask();
        task.applyStatus(TaskStatus.DONE, NOW);
        task.applyStatus(TaskStatus.DONE, NOW.plus(1, ChronoUnit.DAYS));

        assertThat(task.getCompletedAt()).isEqualTo(NOW);
    }

    @Test
    void reabrirLimpaADataDeConclusao() {
        Task task = newTask();
        task.applyStatus(TaskStatus.DONE, NOW);
        task.applyStatus(TaskStatus.IN_PROGRESS, NOW.plusSeconds(60));

        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(task.getCompletedAt()).isNull();
    }

    @Test
    void transicaoEntreStatusAbertosNaoCriaDataDeConclusao() {
        Task task = newTask();
        task.applyStatus(TaskStatus.IN_PROGRESS, NOW);
        task.applyStatus(TaskStatus.TODO, NOW);

        assertThat(task.getCompletedAt()).isNull();
    }

    @Test
    void atrasadaSomenteQuandoNaoConcluidaEComPrazoNoPassado() {
        Task task = newTask();
        assertThat(task.isOverdueAt(NOW)).as("sem prazo").isFalse();

        task.setDueAt(NOW.plusSeconds(1));
        assertThat(task.isOverdueAt(NOW)).as("prazo futuro").isFalse();

        task.setDueAt(NOW.minusSeconds(1));
        assertThat(task.isOverdueAt(NOW)).as("prazo vencido e aberta").isTrue();

        task.applyStatus(TaskStatus.DONE, NOW);
        assertThat(task.isOverdueAt(NOW)).as("prazo vencido e concluída").isFalse();
    }

    @Test
    void prazoExatamenteAgoraAindaNaoEstaAtrasado() {
        Task task = newTask();
        task.setDueAt(NOW);
        assertThat(task.isOverdueAt(NOW)).isFalse();
    }
}

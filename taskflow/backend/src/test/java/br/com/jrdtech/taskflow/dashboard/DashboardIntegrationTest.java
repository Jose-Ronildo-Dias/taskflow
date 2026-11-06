package br.com.jrdtech.taskflow.dashboard;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.jrdtech.taskflow.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import org.junit.jupiter.api.Test;

class DashboardIntegrationTest extends AbstractIntegrationTest {

    @Test
    void calculaIndicadoresComBaseNosDadosReaisDoUsuario() throws Exception {
        Cookie session = newUser("dash@exemplo.com");

        Map<String, Object> overdue = taskBody("Atrasada");
        overdue.put("dueAt", Instant.now().minus(2, ChronoUnit.HOURS).toString());
        createTask(session, overdue);

        Map<String, Object> soon = taskBody("Vence logo");
        soon.put("status", "IN_PROGRESS");
        soon.put("priority", "URGENT");
        soon.put("dueAt", Instant.now().plus(5, ChronoUnit.HOURS).toString());
        createTask(session, soon);

        Map<String, Object> later = taskBody("Vence depois");
        later.put("priority", "HIGH");
        later.put("dueAt", Instant.now().plus(10, ChronoUnit.DAYS).toString());
        createTask(session, later);

        Map<String, Object> doneAndExpired = taskBody("Concluída e vencida");
        doneAndExpired.put("status", "DONE");
        doneAndExpired.put("dueAt", Instant.now().minus(5, ChronoUnit.DAYS).toString());
        createTask(session, doneAndExpired);

        createTask(session, taskBody("Sem prazo"));

        mvc.perform(get("/api/v1/dashboard/summary").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(5))
                .andExpect(jsonPath("$.todo").value(3))
                .andExpect(jsonPath("$.inProgress").value(1))
                .andExpect(jsonPath("$.done").value(1))
                .andExpect(jsonPath("$.overdue").value(1))
                .andExpect(jsonPath("$.dueSoon").value(1))
                .andExpect(jsonPath("$.priorityTasks", hasSize(2)))
                .andExpect(jsonPath("$.priorityTasks[0].title").value("Vence logo"))
                .andExpect(jsonPath("$.deadlineTasks", hasSize(3)))
                .andExpect(jsonPath("$.deadlineTasks[0].title").value("Atrasada"));

        mvc.perform(get("/api/v1/dashboard/recent-tasks").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[0].title").value("Sem prazo"));
    }

    @Test
    void indicadoresNaoMisturamDadosDeUsuariosDiferentes() throws Exception {
        Cookie alice = newUser("alice@exemplo.com");
        Cookie bob = newUser("bob@exemplo.com");
        createTask(alice, taskBody("Da Alice 1"));
        createTask(alice, taskBody("Da Alice 2"));
        createTask(bob, taskBody("Do Bob"));

        mvc.perform(get("/api/v1/dashboard/summary").cookie(alice)).andExpect(jsonPath("$.total").value(2));
        mvc.perform(get("/api/v1/dashboard/summary").cookie(bob)).andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/v1/dashboard/recent-tasks").cookie(bob))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Do Bob"));
    }

    @Test
    void contaNovaTemIndicadoresZerados() throws Exception {
        Cookie session = newUser("vazio@exemplo.com");
        mvc.perform(get("/api/v1/dashboard/summary").cookie(session))
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.overdue").value(0))
                .andExpect(jsonPath("$.priorityTasks", hasSize(0)));
    }
}

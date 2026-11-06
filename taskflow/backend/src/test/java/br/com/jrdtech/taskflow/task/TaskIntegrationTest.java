package br.com.jrdtech.taskflow.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.jrdtech.taskflow.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import org.junit.jupiter.api.Test;

class TaskIntegrationTest extends AbstractIntegrationTest {

    @Test
    void criaConsultaEditaEExcluiTarefa() throws Exception {
        Cookie session = newUser("tarefas@exemplo.com");
        String categoryId = createCategory(session, "Trabalho");

        Map<String, Object> body = taskBody("  Escrever relatório  ");
        body.put("description", "Fechar o trimestre");
        body.put("priority", "HIGH");
        body.put("categoryId", categoryId);
        body.put("dueAt", Instant.now().plus(2, ChronoUnit.DAYS).toString());
        String id = createTask(session, body);

        mvc.perform(get("/api/v1/tasks/" + id).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Escrever relatório"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.category.name").value("Trabalho"))
                .andExpect(jsonPath("$.overdue").value(false));

        body.put("title", "Relatório final");
        body.put("status", "IN_PROGRESS");
        mvc.perform(jsonBody(as(put("/api/v1/tasks/" + id), session), body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Relatório final"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mvc.perform(as(delete("/api/v1/tasks/" + id), session)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tasks/" + id).cookie(session)).andExpect(status().isNotFound());
        assertThat(jdbc.queryForObject("select count(*) from tasks", Integer.class)).isZero();
    }

    @Test
    void concluirRegistraDataEReabrirLimpa() throws Exception {
        Cookie session = newUser("status@exemplo.com");
        String id = createTask(session, taskBody("Pagar conta"));

        mvc.perform(get("/api/v1/tasks/" + id).cookie(session))
                .andExpect(jsonPath("$.completedAt").doesNotExist());

        mvc.perform(jsonBody(as(patch("/api/v1/tasks/" + id + "/status"), session), Map.of("status", "DONE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"))
                .andExpect(jsonPath("$.completedAt").isNotEmpty());

        mvc.perform(jsonBody(as(patch("/api/v1/tasks/" + id + "/status"), session), Map.of("status", "TODO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TODO"))
                .andExpect(jsonPath("$.completedAt").doesNotExist());
    }

    @Test
    void atualizacaoComStatusConcluidoPeloPutTambemRegistraConclusao() throws Exception {
        Cookie session = newUser("put@exemplo.com");
        String id = createTask(session, taskBody("Tarefa"));

        Map<String, Object> body = taskBody("Tarefa");
        body.put("status", "DONE");
        mvc.perform(jsonBody(as(put("/api/v1/tasks/" + id), session), body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedAt").isNotEmpty());
    }

    @Test
    void tarefaConcluidaComPrazoVencidoNaoEhAtrasada() throws Exception {
        Cookie session = newUser("atraso@exemplo.com");
        Map<String, Object> body = taskBody("Antiga");
        body.put("dueAt", Instant.now().minus(3, ChronoUnit.DAYS).toString());
        String id = createTask(session, body);

        mvc.perform(get("/api/v1/tasks/" + id).cookie(session)).andExpect(jsonPath("$.overdue").value(true));

        mvc.perform(jsonBody(as(patch("/api/v1/tasks/" + id + "/status"), session), Map.of("status", "DONE")))
                .andExpect(jsonPath("$.overdue").value(false));
    }

    @Test
    void validaCamposDaTarefa() throws Exception {
        Cookie session = newUser("valida@exemplo.com");

        Map<String, Object> blank = taskBody("   ");
        mvc.perform(jsonBody(as(post("/api/v1/tasks"), session), blank))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'title')]").exists());

        Map<String, Object> longTitle = taskBody("x".repeat(151));
        mvc.perform(jsonBody(as(post("/api/v1/tasks"), session), longTitle)).andExpect(status().isBadRequest());

        Map<String, Object> badStatus = taskBody("Ok");
        badStatus.put("status", "ARQUIVADA");
        mvc.perform(jsonBody(as(post("/api/v1/tasks"), session), badStatus)).andExpect(status().isBadRequest());

        Map<String, Object> badPriority = taskBody("Ok");
        badPriority.put("priority", "CRITICA");
        mvc.perform(jsonBody(as(post("/api/v1/tasks"), session), badPriority)).andExpect(status().isBadRequest());

        assertThat(jdbc.queryForObject("select count(*) from tasks", Integer.class)).isZero();
    }

    @Test
    void filtrosPesquisaOrdenacaoEPaginacao() throws Exception {
        Cookie session = newUser("filtros@exemplo.com");
        String categoryId = createCategory(session, "Casa");

        Map<String, Object> a = taskBody("Comprar leite");
        a.put("priority", "LOW");
        a.put("categoryId", categoryId);
        createTask(session, a);

        Map<String, Object> b = taskBody("Estudar Java");
        b.put("description", "capítulo sobre LEITE de coco? não, sobre streams");
        b.put("priority", "URGENT");
        b.put("status", "IN_PROGRESS");
        b.put("dueAt", Instant.now().minus(1, ChronoUnit.DAYS).toString());
        createTask(session, b);

        Map<String, Object> c = taskBody("Ligar para o banco");
        c.put("priority", "HIGH");
        c.put("dueAt", Instant.now().plus(1, ChronoUnit.DAYS).toString());
        createTask(session, c);

        Map<String, Object> d = taskBody("Tarefa 100% pronta_");
        d.put("status", "DONE");
        createTask(session, d);

        mvc.perform(get("/api/v1/tasks").param("q", "leite").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/v1/tasks").param("q", "100%").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Tarefa 100% pronta_"));
        mvc.perform(get("/api/v1/tasks").param("q", "%").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/v1/tasks").param("status", "IN_PROGRESS").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/v1/tasks").param("priority", "HIGH").cookie(session))
                .andExpect(jsonPath("$.content[0].title").value("Ligar para o banco"));
        mvc.perform(get("/api/v1/tasks").param("categoryId", categoryId).cookie(session))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Comprar leite"));
        mvc.perform(get("/api/v1/tasks").param("withoutCategory", "true").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(3));
        mvc.perform(get("/api/v1/tasks").param("overdue", "true").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Estudar Java"));
        mvc.perform(get("/api/v1/tasks").param("noDueDate", "true").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/v1/tasks")
                        .param("dueFrom", Instant.now().toString())
                        .param("dueTo", Instant.now().plus(3, ChronoUnit.DAYS).toString())
                        .cookie(session))
                .andExpect(jsonPath("$.totalElements").value(1));

        mvc.perform(get("/api/v1/tasks").param("sort", "priority").param("direction", "desc").cookie(session))
                .andExpect(jsonPath("$.content[0].priority").value("URGENT"))
                .andExpect(jsonPath("$.content[1].priority").value("HIGH"));
        mvc.perform(get("/api/v1/tasks").param("sort", "title").param("direction", "asc").cookie(session))
                .andExpect(jsonPath("$.content[0].title").value("Comprar leite"));
        mvc.perform(get("/api/v1/tasks").param("sort", "dueAt").param("direction", "asc").cookie(session))
                .andExpect(jsonPath("$.content[0].title").value("Estudar Java"))
                .andExpect(jsonPath("$.content[1].title").value("Ligar para o banco"));

        mvc.perform(get("/api/v1/tasks").param("size", "3").param("page", "1").cookie(session))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.totalPages").value(2));

        mvc.perform(get("/api/v1/tasks").param("sort", "senha").cookie(session)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/tasks").param("size", "1000").cookie(session)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/tasks").param("status", "INEXISTENTE").cookie(session))
                .andExpect(status().isBadRequest());
    }

    @Test
    void usuarioNaoAcessaNemAlteraTarefasDeOutro() throws Exception {
        Cookie owner = newUser("dono@exemplo.com");
        Cookie intruder = newUser("intruso@exemplo.com");
        String taskId = createTask(owner, taskBody("Segredo do dono"));
        String ownerCategory = createCategory(owner, "Privada");

        mvc.perform(get("/api/v1/tasks/" + taskId).cookie(intruder)).andExpect(status().isNotFound());
        mvc.perform(jsonBody(as(put("/api/v1/tasks/" + taskId), intruder), taskBody("Invadida")))
                .andExpect(status().isNotFound());
        mvc.perform(jsonBody(as(patch("/api/v1/tasks/" + taskId + "/status"), intruder), Map.of("status", "DONE")))
                .andExpect(status().isNotFound());
        mvc.perform(as(delete("/api/v1/tasks/" + taskId), intruder)).andExpect(status().isNotFound());

        mvc.perform(get("/api/v1/tasks").cookie(intruder))
                .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/v1/tasks").param("q", "Segredo").cookie(intruder))
                .andExpect(jsonPath("$.totalElements").value(0));

        Map<String, Object> withForeignCategory = taskBody("Tentativa");
        withForeignCategory.put("categoryId", ownerCategory);
        mvc.perform(jsonBody(as(post("/api/v1/tasks"), intruder), withForeignCategory))
                .andExpect(status().isNotFound());

        mvc.perform(get("/api/v1/tasks/" + taskId).cookie(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Segredo do dono"))
                .andExpect(jsonPath("$.status").value("TODO"));
    }

    @Test
    void proprietarioInformadoNoCorpoEhIgnorado() throws Exception {
        Cookie alice = newUser("alice@exemplo.com");
        Cookie bob = newUser("bob@exemplo.com");
        String bobId = jdbc.queryForObject("select id::text from users where email = 'bob@exemplo.com'",
                String.class);

        Map<String, Object> body = taskBody("Minha tarefa");
        body.put("userId", bobId);
        String taskId = createTask(alice, body);

        String owner = jdbc.queryForObject("select u.email from tasks t join users u on u.id = t.user_id "
                + "where t.id = ?::uuid", String.class, taskId);
        assertThat(owner).isEqualTo("alice@exemplo.com");
        mvc.perform(get("/api/v1/tasks/" + taskId).cookie(bob)).andExpect(status().isNotFound());
    }
}

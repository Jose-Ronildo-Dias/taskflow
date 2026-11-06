package br.com.jrdtech.taskflow.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.jrdtech.taskflow.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import org.junit.jupiter.api.Test;

class CategoryIntegrationTest extends AbstractIntegrationTest {

    @Test
    void criaEditaEListaCategoriasComContagemDeTarefas() throws Exception {
        Cookie session = newUser("cat@exemplo.com");
        String id = createCategory(session, "Estudos");
        Map<String, Object> task = taskBody("Ler capítulo");
        task.put("categoryId", id);
        createTask(session, task);

        mvc.perform(jsonBody(as(put("/api/v1/categories/" + id), session),
                        Map.of("name", "Faculdade", "color", "#ff8800")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Faculdade"))
                .andExpect(jsonPath("$.taskCount").value(1));

        mvc.perform(get("/api/v1/categories").cookie(session))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].color").value("#ff8800"))
                .andExpect(jsonPath("$[0].taskCount").value(1));
    }

    @Test
    void rejeitaNomeDuplicadoDoMesmoUsuarioMasPermiteEmOutro() throws Exception {
        Cookie first = newUser("um@exemplo.com");
        Cookie second = newUser("dois@exemplo.com");
        createCategory(first, "Trabalho");

        mvc.perform(jsonBody(as(post("/api/v1/categories"), first), Map.of("name", "  trabalho ")))
                .andExpect(status().isConflict());

        mvc.perform(jsonBody(as(post("/api/v1/categories"), second), Map.of("name", "Trabalho")))
                .andExpect(status().isCreated());
    }

    @Test
    void validaNomeECor() throws Exception {
        Cookie session = newUser("valida@exemplo.com");
        mvc.perform(jsonBody(as(post("/api/v1/categories"), session), Map.of("name", " ")))
                .andExpect(status().isBadRequest());
        mvc.perform(jsonBody(as(post("/api/v1/categories"), session), Map.of("name", "x".repeat(61))))
                .andExpect(status().isBadRequest());
        mvc.perform(jsonBody(as(post("/api/v1/categories"), session), Map.of("name", "Ok", "color", "vermelho")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'color')]").exists());
    }

    @Test
    void excluirCategoriaMantemTarefasSemCategoria() throws Exception {
        Cookie session = newUser("excluir@exemplo.com");
        String categoryId = createCategory(session, "Temporária");
        Map<String, Object> task = taskBody("Continua existindo");
        task.put("categoryId", categoryId);
        String taskId = createTask(session, task);

        mvc.perform(as(delete("/api/v1/categories/" + categoryId), session)).andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/tasks/" + taskId).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Continua existindo"))
                .andExpect(jsonPath("$.category").doesNotExist());
        assertThat(jdbc.queryForObject("select count(*) from categories", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from tasks", Integer.class)).isEqualTo(1);
    }

    @Test
    void usuarioNaoVeNemAlteraCategoriasDeOutro() throws Exception {
        Cookie owner = newUser("dona@exemplo.com");
        Cookie intruder = newUser("intrusa@exemplo.com");
        String id = createCategory(owner, "Privada");

        mvc.perform(get("/api/v1/categories/" + id).cookie(intruder)).andExpect(status().isNotFound());
        mvc.perform(jsonBody(as(put("/api/v1/categories/" + id), intruder), Map.of("name", "Roubada")))
                .andExpect(status().isNotFound());
        mvc.perform(as(delete("/api/v1/categories/" + id), intruder)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/categories").cookie(intruder)).andExpect(jsonPath("$", hasSize(0)));

        mvc.perform(get("/api/v1/categories/" + id).cookie(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Privada"));
    }
}

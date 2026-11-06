package br.com.jrdtech.taskflow.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.jrdtech.taskflow.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class UserIntegrationTest extends AbstractIntegrationTest {

    @Test
    void atualizaNomeMasNaoOPapelNemOEmail() throws Exception {
        Cookie session = newUser("perfil@exemplo.com");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", "Novo Nome");
        body.put("role", "ADMIN");
        body.put("email", "outro@exemplo.com");
        mvc.perform(jsonBody(as(patch("/api/v1/users/me"), session), body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Novo Nome"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.email").value("perfil@exemplo.com"));

        assertThat(jdbc.queryForObject("select role from users", String.class)).isEqualTo("USER");
        assertThat(jdbc.queryForObject("select email from users", String.class)).isEqualTo("perfil@exemplo.com");
    }

    @Test
    void nomeInvalidoEhRejeitado() throws Exception {
        Cookie session = newUser("nome@exemplo.com");
        mvc.perform(jsonBody(as(patch("/api/v1/users/me"), session), Map.of("name", " ")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void alterarSenhaExigeSenhaAtualMantemSessaoAtualEEncerraAsOutras() throws Exception {
        Cookie current = newUser("troca@exemplo.com");
        Cookie other = login("troca@exemplo.com", PASSWORD);

        mvc.perform(jsonBody(as(patch("/api/v1/users/me/password"), current),
                        Map.of("currentPassword", "Errada123", "newPassword", "NovaSenha789")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("currentPassword"));

        mvc.perform(jsonBody(as(patch("/api/v1/users/me/password"), current),
                        Map.of("currentPassword", PASSWORD, "newPassword", "fraca")))
                .andExpect(status().isBadRequest());

        mvc.perform(jsonBody(as(patch("/api/v1/users/me/password"), current),
                        Map.of("currentPassword", PASSWORD, "newPassword", "NovaSenha789")))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/users/me").cookie(current)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/users/me").cookie(other)).andExpect(status().isUnauthorized());

        login("troca@exemplo.com", "NovaSenha789");
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "troca@exemplo.com", "password", PASSWORD))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void excluirContaExigeSenhaERemoveTodosOsDados() throws Exception {
        Cookie session = newUser("apagar@exemplo.com");
        Cookie bystander = newUser("fica@exemplo.com");
        String category = createCategory(session, "Minha");
        Map<String, Object> task = taskBody("Será apagada");
        task.put("categoryId", category);
        createTask(session, task);
        createTask(bystander, taskBody("Continua"));

        mvc.perform(jsonBody(as(delete("/api/v1/users/me"), session), Map.of("password", "Errada123")))
                .andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("select count(*) from users", Integer.class)).isEqualTo(2);

        mvc.perform(jsonBody(as(delete("/api/v1/users/me"), session), Map.of("password", PASSWORD)))
                .andExpect(status().isNoContent());

        assertThat(jdbc.queryForObject("select count(*) from users where email = 'apagar@exemplo.com'",
                Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from tasks", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from categories", Integer.class)).isZero();
        mvc.perform(get("/api/v1/auth/me").cookie(session)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/tasks").cookie(bystander)).andExpect(jsonPath("$.totalElements").value(1));

        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(
                                Map.of("email", "apagar@exemplo.com", "password", PASSWORD))))
                .andExpect(status().isUnauthorized());
    }
}

package br.com.jrdtech.taskflow.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.jrdtech.taskflow.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @Test
    void registraUsuarioComSenhaEmHashEPapelUser() throws Exception {
        Map<String, Object> body = registerBody("Maria@Exemplo.COM", PASSWORD);
        body.put("role", "ADMIN");

        MvcResult result = mvc.perform(post("/api/v1/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("maria@exemplo.com"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(content().string(not(containsString("password"))))
                .andExpect(content().string(not(containsString("hash"))))
                .andReturn();

        assertThat(result.getResponse().getCookie(SESSION_COOKIE)).isNotNull();
        String stored = jdbc.queryForObject("select password_hash from users where email = 'maria@exemplo.com'",
                String.class);
        assertThat(stored).startsWith("$2").isNotEqualTo(PASSWORD);
        assertThat(jdbc.queryForObject("select role from users", String.class)).isEqualTo("USER");
    }

    @Test
    void rejeitaEmailDuplicadoIgnorandoMaiusculas() throws Exception {
        newUser("ana@exemplo.com");

        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(registerBody("ANA@exemplo.com", PASSWORD))))
                .andExpect(status().isConflict());

        assertThat(jdbc.queryForObject("select count(*) from users", Integer.class)).isEqualTo(1);
    }

    @Test
    void validaCamposDoCadastro() throws Exception {
        Map<String, Object> weak = registerBody("a@exemplo.com", "somenteletras");
        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(weak)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'password')]").exists());

        Map<String, Object> mismatch = registerBody("b@exemplo.com", PASSWORD);
        mismatch.put("confirmPassword", "Outra1234");
        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(mismatch)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("confirmPassword"));

        Map<String, Object> noTerms = registerBody("c@exemplo.com", PASSWORD);
        noTerms.put("acceptTerms", false);
        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(noTerms)))
                .andExpect(status().isBadRequest());

        Map<String, Object> badEmail = registerBody("nao-e-email", PASSWORD);
        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(badEmail)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'email')]").exists());

        assertThat(jdbc.queryForObject("select count(*) from users", Integer.class)).isZero();
    }

    @Test
    void loginValidoEmiteSessaoEInvalidoUsaMensagemGenerica() throws Exception {
        newUser("joao@exemplo.com");

        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "JOAO@exemplo.com", "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("joao@exemplo.com"));

        String wrongPassword = mvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "joao@exemplo.com", "password", "Errada123"))))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String unknownUser = mvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "ninguem@exemplo.com", "password", "Errada123"))))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        assertThat(json.readTree(wrongPassword).get("message").asText())
                .isEqualTo(json.readTree(unknownUser).get("message").asText());
    }

    @Test
    void endpointsPrivadosExigemSessaoValida() throws Exception {
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/tasks")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/categories")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/dashboard/summary")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());

        mvc.perform(get("/api/v1/auth/me").cookie(new Cookie(SESSION_COOKIE, "sessao-inexistente")))
                .andExpect(status().isUnauthorized());

        Cookie session = newUser("sessao@exemplo.com");
        mvc.perform(get("/api/v1/auth/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("sessao@exemplo.com"));
    }

    @Test
    void logoutInvalidaASessaoNoServidor() throws Exception {
        Cookie session = newUser("saida@exemplo.com");
        assertThat(jdbc.queryForObject("select count(*) from spring_session", Integer.class)).isEqualTo(1);

        mvc.perform(post("/api/v1/auth/logout").cookie(session).with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(jdbc.queryForObject("select count(*) from spring_session", Integer.class)).isZero();
        mvc.perform(get("/api/v1/auth/me").cookie(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void requisicaoDeEscritaSemTokenCsrfEhRecusada() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "a@b.com", "password", "x"))))
                .andExpect(status().isForbidden());

        Cookie session = newUser("csrf@exemplo.com");
        mvc.perform(post("/api/v1/tasks").cookie(session).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(taskBody("Sem CSRF"))))
                .andExpect(status().isForbidden());
        assertThat(jdbc.queryForObject("select count(*) from tasks", Integer.class)).isZero();
    }

    @Test
    void bloqueiaLoginAposTentativasFalhasSeguidas() throws Exception {
        newUser("forca@exemplo.com");
        Map<String, String> wrong = Map.of("email", "forca@exemplo.com", "password", "Errada123");

        for (int i = 0; i < LoginAttemptService.MAX_FAILURES; i++) {
            mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(wrong)))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "forca@exemplo.com", "password", PASSWORD))))
                .andExpect(status().isTooManyRequests());
    }
}

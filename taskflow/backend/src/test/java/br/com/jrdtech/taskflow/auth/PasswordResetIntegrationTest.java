package br.com.jrdtech.taskflow.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.jrdtech.taskflow.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class PasswordResetIntegrationTest extends AbstractIntegrationTest {

    private String requestReset(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/forgot-password").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isAccepted())
                .andReturn().getResponse().getContentAsString();
    }

    private void reset(String token, String newPassword, int expectedStatus) throws Exception {
        mvc.perform(post("/api/v1/auth/reset-password").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("token", token, "newPassword", newPassword))))
                .andExpect(status().is(expectedStatus));
    }

    @Test
    void respostaEhIdenticaParaEmailExistenteEInexistente() throws Exception {
        newUser("existe@exemplo.com");

        String known = requestReset("existe@exemplo.com");
        String unknown = requestReset("nao-existe@exemplo.com");

        assertThat(known).isEqualTo(unknown);
        assertThat(mail.sent()).hasSize(1);
        assertThat(mail.sent().get(0).toEmail()).isEqualTo("existe@exemplo.com");
    }

    @Test
    void tokenFuncionaUmaVezEFicaArmazenadoSomenteComoHash() throws Exception {
        newUser("reset@exemplo.com");
        requestReset("reset@exemplo.com");
        String token = mail.sent().get(0).token();

        String stored = jdbc.queryForObject("select token_hash from password_reset_tokens", String.class);
        assertThat(stored).hasSize(64).isNotEqualTo(token).doesNotContain(token);

        reset(token, "NovaSenha789", 204);
        login("reset@exemplo.com", "NovaSenha789");
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "reset@exemplo.com", "password", PASSWORD))))
                .andExpect(status().isUnauthorized());

        reset(token, "OutraSenha000", 400);
    }

    @Test
    void tokenExpiradoEhRecusado() throws Exception {
        newUser("expira@exemplo.com");
        requestReset("expira@exemplo.com");
        String token = mail.sent().get(0).token();

        jdbc.update("update password_reset_tokens set expires_at = now() - interval '1 minute'");

        reset(token, "NovaSenha789", 400);
        login("expira@exemplo.com", PASSWORD);
    }

    @Test
    void tokenInventadoOuMalformadoEhRecusado() throws Exception {
        reset("token-que-nunca-existiu", "NovaSenha789", 400);
        reset("", "NovaSenha789", 400);
    }

    @Test
    void novaSolicitacaoInvalidaOTokenAnterior() throws Exception {
        newUser("duas@exemplo.com");
        requestReset("duas@exemplo.com");
        String first = mail.sent().get(0).token();
        requestReset("duas@exemplo.com");
        String second = mail.sent().get(1).token();

        reset(first, "NovaSenha789", 400);
        reset(second, "NovaSenha789", 204);
    }

    @Test
    void novaSenhaPrecisaAtenderARegraDeForca() throws Exception {
        newUser("fraca@exemplo.com");
        requestReset("fraca@exemplo.com");
        String token = mail.sent().get(0).token();

        reset(token, "curta1", 400);
        reset(token, "semnumeroalgum", 400);
        reset(token, "NovaSenha789", 204);
    }

    @Test
    void redefinirSenhaEncerraAsSessoesAtivas() throws Exception {
        Cookie session = newUser("sessoes@exemplo.com");
        mvc.perform(get("/api/v1/auth/me").cookie(session)).andExpect(status().isOk());

        requestReset("sessoes@exemplo.com");
        reset(mail.sent().get(0).token(), "NovaSenha789", 204);

        mvc.perform(get("/api/v1/auth/me").cookie(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void emailInvalidoNaSolicitacaoEhRejeitado() throws Exception {
        mvc.perform(post("/api/v1/auth/forgot-password").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "isso-nao-e-email"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("email"));
    }
}

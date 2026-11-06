package br.com.jrdtech.taskflow.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.jrdtech.taskflow.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MvcResult;

/**
 * O csrf() do spring-security-test troca, de forma permanente, o repositório de tokens do filtro compartilhado
 * por um baseado em sessão. Esta classe usa contexto novo e nunca chama csrf(), para exercitar o repositório
 * real da aplicação, baseado em cookie.
 */
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class CsrfCookieIntegrationTest extends AbstractIntegrationTest {

    @Test
    void emiteCookieCsrfELegivelPeloJavaScript() throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isNoContent()).andReturn();

        Cookie xsrf = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(xsrf).isNotNull();
        assertThat(xsrf.isHttpOnly()).isFalse();
        assertThat(xsrf.getValue()).isNotBlank();
    }

    @Test
    void aceitaEscritaSomenteQuandoOCabecalhoCoincideComOCookie() throws Exception {
        Cookie xsrf = mvc.perform(get("/api/v1/auth/csrf")).andReturn().getResponse().getCookie("XSRF-TOKEN");
        assertThat(xsrf).isNotNull();
        String body = json.writeValueAsString(Map.of("email", "a@b.com", "password", "x"));

        mvc.perform(post("/api/v1/auth/login").cookie(xsrf).header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/auth/login").cookie(xsrf).header("X-XSRF-TOKEN", "outro-valor")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
    }
}

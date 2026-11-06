package br.com.jrdtech.taskflow.support;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base dos testes de integração: PostgreSQL real em container (compartilhado por toda a suíte),
 * migrations Flyway reais e a cadeia de filtros do Spring Security completa.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestMailConfig.class)
public abstract class AbstractIntegrationTest {

    protected static final String SESSION_COOKIE = "TASKFLOW_SESSION";
    protected static final String PASSWORD = "Senha1234";

    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    protected MockMvc mvc;
    @Autowired
    protected ObjectMapper json;
    @Autowired
    protected JdbcTemplate jdbc;
    @Autowired
    protected CapturingMailService mail;

    @BeforeEach
    void cleanDatabase() {
        jdbc.execute("truncate table password_reset_tokens, tasks, categories, "
                + "spring_session_attributes, spring_session, users cascade");
        mail.clear();
    }

    protected Map<String, Object> registerBody(String email, String password) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", "Usuário de Teste");
        body.put("email", email);
        body.put("password", password);
        body.put("confirmPassword", password);
        body.put("acceptTerms", true);
        return body;
    }

    /** Cadastra um usuário e devolve o cookie de sessão emitido. */
    protected Cookie newUser(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(registerBody(email, PASSWORD))))
                .andExpect(status().isCreated())
                .andReturn();
        Cookie cookie = result.getResponse().getCookie(SESSION_COOKIE);
        if (cookie == null) {
            throw new AssertionError("O cadastro não emitiu o cookie de sessão");
        }
        return cookie;
    }

    protected Cookie login(String email, String password) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getCookie(SESSION_COOKIE);
    }

    protected MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder builder, Cookie session) {
        return builder.cookie(session).with(csrf());
    }

    protected MockHttpServletRequestBuilder jsonBody(MockHttpServletRequestBuilder builder, Object body)
            throws Exception {
        return builder.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
    }

    protected Map<String, Object> taskBody(String title) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("title", title);
        body.put("status", "TODO");
        body.put("priority", "MEDIUM");
        return body;
    }

    protected JsonNode read(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }

    protected String createTask(Cookie session, Map<String, Object> body) throws Exception {
        MvcResult result = mvc.perform(jsonBody(as(post("/api/v1/tasks"), session), body))
                .andExpect(status().isCreated())
                .andReturn();
        return read(result).get("id").asText();
    }

    protected String createCategory(Cookie session, String name) throws Exception {
        MvcResult result = mvc.perform(jsonBody(as(post("/api/v1/categories"), session),
                        Map.of("name", name, "color", "#3366ff")))
                .andExpect(status().isCreated())
                .andReturn();
        return read(result).get("id").asText();
    }
}

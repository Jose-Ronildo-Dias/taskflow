package br.com.jrdtech.taskflow.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI taskflowOpenApi() {
        return new OpenAPI().info(new Info()
                .title("TaskFlow API")
                .version("v1")
                .description("API de gerenciamento de tarefas. A autenticação usa cookie de sessão "
                        + "(TASKFLOW_SESSION) e exige o cabeçalho X-XSRF-TOKEN nas requisições que alteram dados."));
    }
}

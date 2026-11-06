package br.com.jrdtech.taskflow.config;

import br.com.jrdtech.taskflow.common.JsonErrorWriter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Recusa corpos JSON grandes demais para esta API (o maior payload legítimo tem poucos KB). */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class RequestSizeLimitFilter extends OncePerRequestFilter {

    static final long MAX_BODY_BYTES = 64 * 1024;

    private final JsonErrorWriter errors;

    public RequestSizeLimitFilter(JsonErrorWriter errors) {
        this.errors = errors;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getContentLengthLong() > MAX_BODY_BYTES) {
            errors.write(request, response, HttpStatus.PAYLOAD_TOO_LARGE, "O corpo da requisição é grande demais.");
            return;
        }
        chain.doFilter(request, response);
    }
}

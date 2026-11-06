package br.com.jrdtech.taskflow.auth;

import br.com.jrdtech.taskflow.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Usado quando o envio de e-mail não está configurado: nada é enviado e o aviso fica registrado.
 * Somente para desenvolvimento local, MAIL_LOG_LINKS=true imprime o link no log para facilitar os testes;
 * essa opção nunca deve ser usada em produção, pois o log passaria a conter credenciais de redefinição.
 */
@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "false", matchIfMissing = true)
public class DisabledMailService implements MailService {

    private static final Logger log = LoggerFactory.getLogger(DisabledMailService.class);

    private final AppProperties properties;

    public DisabledMailService(AppProperties properties) {
        this.properties = properties;
    }

    @Override
    public void sendPasswordReset(String toEmail, String toName, String resetLink) {
        if (properties.mail().logLinks()) {
            log.warn("[DESENVOLVIMENTO] E-mail desativado. Link de redefinição: {}", resetLink);
        } else {
            log.warn("Envio de e-mail desativado (MAIL_ENABLED=false): a redefinição de senha solicitada não foi enviada.");
        }
    }
}

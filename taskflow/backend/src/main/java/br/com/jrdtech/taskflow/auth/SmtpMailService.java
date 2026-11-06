package br.com.jrdtech.taskflow.auth;

import br.com.jrdtech.taskflow.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/** Envio real por SMTP. Ativado com MAIL_ENABLED=true e as variáveis MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD. */
@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
public class SmtpMailService implements MailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpMailService.class);

    private final JavaMailSender mailSender;
    private final AppProperties properties;

    public SmtpMailService(JavaMailSender mailSender, AppProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    @Async
    @Override
    public void sendPasswordReset(String toEmail, String toName, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.mail().from());
        message.setTo(toEmail);
        message.setSubject("TaskFlow - Redefinição de senha");
        message.setText("""
                Olá, %s!

                Recebemos um pedido para redefinir a senha da sua conta no TaskFlow.
                Para criar uma nova senha, acesse o link abaixo (válido por 1 hora e de uso único):

                %s

                Se você não fez essa solicitação, ignore esta mensagem. Sua senha continuará a mesma.
                """.formatted(toName, resetLink));
        try {
            mailSender.send(message);
        } catch (MailException e) {
            log.error("Falha ao enviar o e-mail de redefinição de senha: {}", e.getClass().getSimpleName());
        }
    }
}

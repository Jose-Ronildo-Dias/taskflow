package br.com.jrdtech.taskflow.support;

import br.com.jrdtech.taskflow.auth.MailService;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Substitui o envio real nos testes e guarda as mensagens para inspeção. */
public class CapturingMailService implements MailService {

    public record Sent(String toEmail, String toName, String link) {

        public String token() {
            return java.net.URLDecoder.decode(link.substring(link.indexOf("token=") + 6),
                    java.nio.charset.StandardCharsets.UTF_8);
        }
    }

    private final List<Sent> sent = new CopyOnWriteArrayList<>();

    @Override
    public void sendPasswordReset(String toEmail, String toName, String resetLink) {
        sent.add(new Sent(toEmail, toName, resetLink));
    }

    public List<Sent> sent() {
        return sent;
    }

    public void clear() {
        sent.clear();
    }
}

package br.com.jrdtech.taskflow.auth;

public interface MailService {

    void sendPasswordReset(String toEmail, String toName, String resetLink);
}

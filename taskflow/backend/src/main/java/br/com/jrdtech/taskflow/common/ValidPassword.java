package br.com.jrdtech.taskflow.common;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.nio.charset.StandardCharsets;

/** Mínimo de 8 caracteres, ao menos uma letra e um número; máximo de 72 bytes (limite do BCrypt). */
@Documented
@Constraint(validatedBy = ValidPassword.Validator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {

    String message() default "A senha deve ter de 8 a 72 caracteres, com ao menos uma letra e um número.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<ValidPassword, String> {

        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            if (value == null) {
                return true;
            }
            if (value.length() < 8 || value.getBytes(StandardCharsets.UTF_8).length > 72) {
                return false;
            }
            boolean hasLetter = value.codePoints().anyMatch(Character::isLetter);
            boolean hasDigit = value.codePoints().anyMatch(Character::isDigit);
            return hasLetter && hasDigit;
        }
    }
}

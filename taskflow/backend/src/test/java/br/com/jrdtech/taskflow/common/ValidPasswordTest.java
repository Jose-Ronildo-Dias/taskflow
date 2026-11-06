package br.com.jrdtech.taskflow.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ValidPasswordTest {

    private final ValidPassword.Validator validator = new ValidPassword.Validator();

    @ParameterizedTest
    @ValueSource(strings = {"Senha1234", "abc12345", "12345678a", "Çenha2026", "uma senha com espaços 1"})
    void aceitaSenhasComLetraENumero(String password) {
        assertThat(validator.isValid(password, null)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "curta1A", "somenteletras", "12345678", "!!!!!!!!!!", "        "})
    void rejeitaSenhasFracas(String password) {
        assertThat(validator.isValid(password, null)).isFalse();
    }

    @ParameterizedTest
    @ValueSource(ints = {72, 73})
    void respeitaOLimiteDe72BytesDoBcrypt(int size) {
        String password = "a1" + "x".repeat(size - 2);
        assertThat(validator.isValid(password, null)).isEqualTo(size <= 72);
    }

    @ParameterizedTest
    @ValueSource(strings = {"ççççççççççççççççççççççççççççççççççççç1"})
    void contaBytesEmVezDeCaracteres(String password) {
        assertThat(password.length()).isLessThan(72);
        assertThat(validator.isValid(password, null)).isFalse();
    }
}

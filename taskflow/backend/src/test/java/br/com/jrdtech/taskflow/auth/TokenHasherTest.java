package br.com.jrdtech.taskflow.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class TokenHasherTest {

    @Test
    void geraTokensUnicosEComEntropiaSuficiente() {
        Set<String> tokens = new HashSet<>();
        for (int i = 0; i < 1000; i++) {
            tokens.add(TokenHasher.newToken());
        }
        assertThat(tokens).hasSize(1000);
        assertThat(tokens).allSatisfy(t -> assertThat(t).hasSize(43).matches("[A-Za-z0-9_-]+"));
    }

    @Test
    void hashEhDeterministicoDe64CaracteresHexadecimais() {
        String hash = TokenHasher.sha256Hex("abc");

        assertThat(hash).isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        assertThat(TokenHasher.sha256Hex("abc")).isEqualTo(hash);
        assertThat(TokenHasher.sha256Hex("abd")).isNotEqualTo(hash);
    }
}

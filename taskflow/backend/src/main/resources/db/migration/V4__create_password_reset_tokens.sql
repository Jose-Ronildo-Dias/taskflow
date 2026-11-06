CREATE TABLE password_reset_tokens (
    id         UUID        PRIMARY KEY,
    user_id    UUID        NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_reset_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX ix_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX ix_reset_tokens_expires ON password_reset_tokens (expires_at);

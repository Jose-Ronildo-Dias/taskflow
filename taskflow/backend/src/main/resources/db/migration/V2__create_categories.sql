CREATE TABLE categories (
    id         UUID        PRIMARY KEY,
    user_id    UUID        NOT NULL,
    name       VARCHAR(60) NOT NULL,
    color      VARCHAR(7),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_categories_id_user UNIQUE (id, user_id),
    CONSTRAINT ck_categories_color CHECK (color IS NULL OR color ~ '^#[0-9a-fA-F]{6}$')
);

CREATE UNIQUE INDEX uq_categories_user_name ON categories (user_id, lower(name));

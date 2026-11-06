CREATE TABLE tasks (
    id           UUID         PRIMARY KEY,
    user_id      UUID         NOT NULL,
    category_id  UUID,
    title        VARCHAR(150) NOT NULL,
    description  VARCHAR(2000),
    status       VARCHAR(20)  NOT NULL,
    priority     VARCHAR(20)  NOT NULL,
    due_at       TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL,
    updated_at   TIMESTAMPTZ  NOT NULL,
    CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    -- a categoria precisa pertencer ao mesmo usuário da tarefa; ao excluir a categoria, só category_id é anulado
    CONSTRAINT fk_tasks_category FOREIGN KEY (category_id, user_id)
        REFERENCES categories (id, user_id) ON DELETE SET NULL (category_id),
    CONSTRAINT ck_tasks_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    CONSTRAINT ck_tasks_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT ck_tasks_completed CHECK ((status = 'DONE') = (completed_at IS NOT NULL))
);

CREATE INDEX ix_tasks_user_status ON tasks (user_id, status);
CREATE INDEX ix_tasks_user_due ON tasks (user_id, due_at);
CREATE INDEX ix_tasks_user_created ON tasks (user_id, created_at DESC);
CREATE INDEX ix_tasks_category ON tasks (category_id);

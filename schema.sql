-- Schema for databaseForOrganizationTemp

CREATE TABLE IF NOT EXISTS members (
    id                  SERIAL PRIMARY KEY,
    full_name           VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    role                VARCHAR(50) DEFAULT 'member',
    reset_token         VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS documents (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    filename    TEXT NOT NULL,
    filepath    TEXT NOT NULL,
    category    TEXT DEFAULT 'Uncategorized',
    access      TEXT DEFAULT 'members' CHECK (access IN ('members', 'admin')),
    uploaded_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_access   ON documents(access);

CREATE TABLE IF NOT EXISTS polls (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    access      VARCHAR(20)  DEFAULT 'members' CHECK (access IN ('members', 'admin')),
    status      VARCHAR(20)  DEFAULT 'scheduled' CHECK (status IN ('active', 'scheduled', 'closed')),
    created_by  INTEGER REFERENCES members(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
    id          SERIAL PRIMARY KEY,
    poll_id     INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    option_text VARCHAR(500) NOT NULL,
    vote_count  INTEGER      DEFAULT 0,
    position    INTEGER      DEFAULT 0
);

CREATE TABLE IF NOT EXISTS votes (
    id        SERIAL PRIMARY KEY,
    poll_id   INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES poll_options(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    voted_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (poll_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_polls_status      ON polls(status);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll        ON votes(poll_id);
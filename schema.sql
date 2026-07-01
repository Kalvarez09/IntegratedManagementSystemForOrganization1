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

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_access   ON documents(access);

CREATE TABLE IF NOT EXISTS polls (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    start_date  TIMESTAMPTZ NOT NULL,
    end_date    TIMESTAMPTZ NOT NULL,
    status      TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'closed')),
    access      TEXT DEFAULT 'members' CHECK (access IN ('members', 'admin')),
    created_by  INTEGER REFERENCES members(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS poll_options (
    id          SERIAL PRIMARY KEY,
    poll_id     INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    vote_count  INTEGER DEFAULT 0
);CREATE TABLE IF NOT EXISTS polls (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    start_date  TIMESTAMPTZ NOT NULL,
    end_date    TIMESTAMPTZ NOT NULL,
    status      TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'closed')),
    access      TEXT DEFAULT 'members' CHECK (access IN ('members', 'admin')),
    created_by  INTEGER REFERENCES members(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS votes (
    id         SERIAL PRIMARY KEY,
    member_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    poll_id    INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id  INTEGER NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    voted_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_id, poll_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_poll ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_member ON votes(member_id);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id          SERIAL PRIMARY KEY,
    type        TEXT NOT NULL CHECK (type IN ('income', 'expenditure')),
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date        DATE NOT NULL,
    category    TEXT DEFAULT 'Other',
    description TEXT,
    recorded_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fin_type     ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fin_date     ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_fin_category ON financial_transactions(category);
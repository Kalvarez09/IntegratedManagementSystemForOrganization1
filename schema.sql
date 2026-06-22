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
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

-- +goose Up
-- +goose StatementBegin
-- AICodeRoom account profiles isolate provider-owned authentication state.
-- Passwords, OAuth tokens, and API keys never live in this table: Codex and
-- Claude Code keep those inside their own config directories / OS keychain.
CREATE TABLE ai_account_profiles (
    id          TEXT PRIMARY KEY,
    harness     TEXT NOT NULL CHECK (harness IN ('codex', 'claude-code')),
    label       TEXT NOT NULL,
    config_dir  TEXT NOT NULL UNIQUE,
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP NOT NULL
);

CREATE INDEX idx_ai_account_profiles_harness
    ON ai_account_profiles(harness, created_at);

-- The binding is kept even if a profile is later removed from the account
-- list, so historical sessions never silently resume under another account.
ALTER TABLE sessions ADD COLUMN account_profile_id TEXT NOT NULL DEFAULT '';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SQLite cannot drop the added sessions column on older supported versions.
-- Down migrations are not used for released AO data directories; remove the
-- profile catalog while preserving the harmless historical binding column.
DROP INDEX IF EXISTS idx_ai_account_profiles_harness;
DROP TABLE IF EXISTS ai_account_profiles;
-- +goose StatementEnd

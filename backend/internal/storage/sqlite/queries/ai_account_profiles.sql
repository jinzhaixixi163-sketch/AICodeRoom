-- AI account profile metadata only. Provider credentials stay provider-owned.

-- name: ListAIAccountProfiles :many
SELECT * FROM ai_account_profiles ORDER BY harness, created_at, id;

-- name: GetAIAccountProfile :one
SELECT * FROM ai_account_profiles WHERE id = ?;

-- name: InsertAIAccountProfile :exec
INSERT INTO ai_account_profiles (
    id, harness, label, config_dir, enabled, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: SetAIAccountProfileEnabled :execrows
UPDATE ai_account_profiles SET enabled = ?, updated_at = ? WHERE id = ?;

-- name: RenameAIAccountProfile :execrows
UPDATE ai_account_profiles SET label = ?, updated_at = ? WHERE id = ?;

-- name: DeleteAIAccountProfile :execrows
DELETE FROM ai_account_profiles WHERE id = ?;

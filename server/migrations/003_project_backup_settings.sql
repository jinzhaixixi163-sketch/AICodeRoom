CREATE TABLE IF NOT EXISTS project_backup_settings (
	project_id uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
	target_type text NOT NULL DEFAULT 'none',
	sync_mode text NOT NULL DEFAULT 'manual',
	repository_url text,
	branch text,
	last_sync_status text NOT NULL DEFAULT 'never',
	last_synced_at timestamptz,
	last_error text,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT project_backup_target_type CHECK (target_type IN ('none', 'local_mirror', 'github')),
	CONSTRAINT project_backup_sync_mode CHECK (sync_mode IN ('manual', 'on_task_complete', 'continuous')),
	CONSTRAINT project_backup_last_sync_status CHECK (last_sync_status IN ('never', 'ready', 'syncing', 'succeeded', 'failed')),
	CONSTRAINT project_backup_github_repository CHECK (
		target_type <> 'github' OR (repository_url IS NOT NULL AND char_length(trim(repository_url)) > 0)
	)
);

CREATE INDEX IF NOT EXISTS project_backup_settings_status_idx
	ON project_backup_settings (last_sync_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS schema_migrations (
	version text PRIMARY KEY,
	applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
	id uuid PRIMARY KEY,
	email text NOT NULL,
	display_name text NOT NULL,
	password_hash text NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT users_email_normalized CHECK (email = lower(email))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);

CREATE TABLE IF NOT EXISTS account_sessions (
	token_hash text PRIMARY KEY,
	user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires_at timestamptz NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_sessions_user_idx ON account_sessions (user_id);
CREATE INDEX IF NOT EXISTS account_sessions_expiry_idx ON account_sessions (expires_at);

CREATE TABLE IF NOT EXISTS projects (
	id uuid PRIMARY KEY,
	name text NOT NULL,
	source_kind text NOT NULL,
	repository_url text,
	created_by uuid NOT NULL REFERENCES users(id),
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT projects_source_kind CHECK (source_kind IN ('local', 'git', 'uploaded')),
	CONSTRAINT projects_name_nonempty CHECK (char_length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS project_members (
	project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	role text NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (project_id, user_id),
	CONSTRAINT project_members_role CHECK (role IN ('owner', 'editor', 'viewer'))
);

CREATE INDEX IF NOT EXISTS project_members_user_idx ON project_members (user_id);

CREATE TABLE IF NOT EXISTS tasks (
	id uuid PRIMARY KEY,
	project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	created_by uuid NOT NULL REFERENCES users(id),
	title text NOT NULL,
	description text NOT NULL DEFAULT '',
	status text NOT NULL DEFAULT 'draft',
	execution_target text NOT NULL DEFAULT 'local_agent',
	ao_session_id text,
	result_summary text,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT tasks_title_nonempty CHECK (char_length(trim(title)) > 0),
	CONSTRAINT tasks_status CHECK (status IN ('draft', 'queued', 'running', 'needs_input', 'completed', 'failed', 'cancelled')),
	CONSTRAINT tasks_execution_target CHECK (execution_target IN ('local_agent', 'cloud_agent'))
);

CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks (project_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS tasks_ao_session_unique
	ON tasks (ao_session_id)
	WHERE ao_session_id IS NOT NULL;

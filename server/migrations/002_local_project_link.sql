ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_project_id text;

CREATE UNIQUE INDEX IF NOT EXISTS projects_creator_client_project_unique
	ON projects (created_by, client_project_id)
	WHERE client_project_id IS NOT NULL;

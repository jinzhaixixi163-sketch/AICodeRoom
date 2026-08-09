import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { PoolClient, QueryResultRow } from "pg";
import type { ServerConfig } from "./config.js";
import { Database } from "./database.js";
import { createAccessToken, hashAccessToken, hashPassword, verifyPassword } from "./security.js";

type UserRow = QueryResultRow & {
	id: string;
	email: string;
	display_name: string;
	created_at: Date;
};

type AuthenticatedUser = { id: string; email: string; displayName: string };
type MemberRole = "owner" | "editor" | "viewer";

class HttpError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		message: string,
	) {
		super(message);
	}
}

const taskStatuses = new Set(["draft", "queued", "running", "needs_input", "completed", "failed", "cancelled"]);
const sourceKinds = new Set(["local", "git", "uploaded"]);
const backupTargetTypes = new Set(["none", "local_mirror", "github"]);
const backupSyncModes = new Set(["manual", "on_task_complete", "continuous"]);
const MAX_BODY_BYTES = 1024 * 1024;

function writeJson(response: ServerResponse, status: number, body: unknown): void {
	const json = JSON.stringify(body);
	response.writeHead(status, {
		"Content-Type": "application/json; charset=utf-8",
		"Content-Length": Buffer.byteLength(json),
		"Cache-Control": "no-store",
	});
	response.end(json);
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
	let size = 0;
	const chunks: Buffer[] = [];
	for await (const chunk of request) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.length;
		if (size > MAX_BODY_BYTES) throw new HttpError(413, "body_too_large", "Request body is too large");
		chunks.push(buffer);
	}
	if (chunks.length === 0) return {};
	try {
		const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("object required");
		return value as Record<string, unknown>;
	} catch {
		throw new HttpError(400, "invalid_json", "Request body must be a JSON object");
	}
}

function textField(body: Record<string, unknown>, name: string, options: { min?: number; max?: number } = {}): string {
	const value = body[name];
	if (typeof value !== "string") throw new HttpError(400, "invalid_input", `${name} must be a string`);
	const normalized = value.trim();
	if (normalized.length < (options.min ?? 1)) throw new HttpError(400, "invalid_input", `${name} is too short`);
	if (normalized.length > (options.max ?? 10_000)) throw new HttpError(400, "invalid_input", `${name} is too long`);
	return normalized;
}

function optionalTextField(body: Record<string, unknown>, name: string, max = 10_000): string | null {
	const value = body[name];
	if (value === undefined || value === null || value === "") return null;
	if (typeof value !== "string" || value.length > max) throw new HttpError(400, "invalid_input", `${name} is invalid`);
	return value.trim();
}

function isGitHubRepositoryUrl(value: string): boolean {
	if (/^git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(value)) return true;
	try {
		const url = new URL(value);
		if (url.hostname.toLowerCase() !== "github.com" || url.password) return false;
		if (url.protocol === "https:" && url.username) return false;
		if (url.protocol === "ssh:" && url.username !== "git") return false;
		if (url.protocol !== "https:" && url.protocol !== "ssh:") return false;
		return /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(url.pathname);
	} catch {
		return false;
	}
}

function isSafeGitBranch(value: string): boolean {
	return (
		value.length > 0 &&
		value.length <= 200 &&
		/^[A-Za-z0-9._/-]+$/.test(value) &&
		!value.startsWith("-") &&
		!value.startsWith("/") &&
		!value.endsWith("/") &&
		!value.endsWith(".") &&
		!value.includes("..") &&
		!value.includes("//") &&
		!value.includes("@{")
	);
}

function publicUser(row: UserRow): AuthenticatedUser & { createdAt: Date } {
	return { id: row.id, email: row.email, displayName: row.display_name, createdAt: row.created_at };
}

function bearerToken(request: IncomingMessage): string {
	const authorization = request.headers.authorization;
	if (!authorization?.startsWith("Bearer ")) throw new HttpError(401, "authentication_required", "Please sign in");
	const token = authorization.slice("Bearer ".length).trim();
	if (!token) throw new HttpError(401, "authentication_required", "Please sign in");
	return token;
}

async function authenticate(database: Database, request: IncomingMessage): Promise<AuthenticatedUser> {
	const token = bearerToken(request);
	const result = await database.query<UserRow>(
		`UPDATE account_sessions AS s
		 SET last_used_at = now()
		 FROM users AS u
		 WHERE s.token_hash = $1 AND s.expires_at > now() AND u.id = s.user_id
		 RETURNING u.id, u.email, u.display_name, u.created_at`,
		[hashAccessToken(token)],
	);
	const row = result.rows[0];
	if (!row) throw new HttpError(401, "session_expired", "Your session has expired");
	return publicUser(row);
}

async function projectRole(database: Database, projectId: string, userId: string): Promise<MemberRole> {
	const result = await database.query<{ role: MemberRole }>(
		"SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2",
		[projectId, userId],
	);
	const role = result.rows[0]?.role;
	if (!role) throw new HttpError(404, "project_not_found", "Project not found");
	return role;
}

function requireEditor(role: MemberRole): void {
	if (role === "viewer") throw new HttpError(403, "insufficient_role", "This project is read-only for your account");
}

async function register(database: Database, config: ServerConfig, request: IncomingMessage, response: ServerResponse) {
	const body = await readJson(request);
	const displayName = textField(body, "displayName", { min: 1, max: 80 });
	const email = textField(body, "email", { min: 3, max: 254 }).toLowerCase();
	const password = textField(body, "password", { min: 10, max: 256 });
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "invalid_email", "Email address is invalid");
	const id = randomUUID();
	const passwordHash = await hashPassword(password);
	try {
		const result = await database.query<UserRow>(
			`INSERT INTO users (id, email, display_name, password_hash)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, email, display_name, created_at`,
			[id, email, displayName, passwordHash],
		);
		const token = await createSession(database, config, id);
		writeJson(response, 201, { accessToken: token, user: publicUser(result.rows[0]!) });
	} catch (error) {
		if (typeof error === "object" && error && "code" in error && error.code === "23505") {
			throw new HttpError(409, "email_exists", "An account with this email already exists");
		}
		throw error;
	}
}

async function createSession(database: Database, config: ServerConfig, userId: string): Promise<string> {
	const token = createAccessToken();
	await database.query(
		"INSERT INTO account_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + ($3 * interval '1 second'))",
		[hashAccessToken(token), userId, config.sessionTtlSeconds],
	);
	return token;
}

async function login(database: Database, config: ServerConfig, request: IncomingMessage, response: ServerResponse) {
	const body = await readJson(request);
	const email = textField(body, "email", { min: 3, max: 254 }).toLowerCase();
	const password = textField(body, "password", { min: 1, max: 256 });
	const result = await database.query<UserRow & { password_hash: string }>(
		"SELECT id, email, display_name, password_hash, created_at FROM users WHERE email = $1",
		[email],
	);
	const row = result.rows[0];
	if (!row || !(await verifyPassword(password, row.password_hash))) {
		throw new HttpError(401, "invalid_credentials", "Email or password is incorrect");
	}
	const token = await createSession(database, config, row.id);
	writeJson(response, 200, { accessToken: token, user: publicUser(row) });
}

async function createProject(database: Database, request: IncomingMessage, response: ServerResponse, user: AuthenticatedUser) {
	const body = await readJson(request);
	const name = textField(body, "name", { min: 1, max: 120 });
	const sourceKind = textField(body, "sourceKind", { max: 20 });
	if (!sourceKinds.has(sourceKind)) throw new HttpError(400, "invalid_source_kind", "sourceKind is invalid");
	const repositoryUrl = optionalTextField(body, "repositoryUrl", 2048);
	const clientProjectId = optionalTextField(body, "clientProjectId", 200);
	const id = randomUUID();
	const project = await database.withClient(async (client: PoolClient) => {
		await client.query("BEGIN");
		try {
			const result = await client.query(
				`INSERT INTO projects (id, name, source_kind, repository_url, client_project_id, created_by)
				 VALUES ($1, $2, $3, $4, $5, $6)
				 ON CONFLICT (created_by, client_project_id) WHERE client_project_id IS NOT NULL
				 DO UPDATE SET name = EXCLUDED.name, repository_url = EXCLUDED.repository_url, updated_at = now()
				 RETURNING id, name, source_kind AS "sourceKind", repository_url AS "repositoryUrl",
				 client_project_id AS "clientProjectId", created_at AS "createdAt"`,
				[id, name, sourceKind, repositoryUrl, clientProjectId, user.id],
			);
			const actualProjectId = result.rows[0]?.id as string;
			await client.query(
				"INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner') ON CONFLICT DO NOTHING",
				[actualProjectId, user.id],
			);
			await client.query("COMMIT");
			return { ...result.rows[0], role: "owner" };
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		}
	});
	writeJson(response, 201, { project });
}

async function listProjects(database: Database, response: ServerResponse, user: AuthenticatedUser) {
	const result = await database.query(
		`SELECT p.id, p.name, p.source_kind AS "sourceKind", p.repository_url AS "repositoryUrl",
		        p.client_project_id AS "clientProjectId",
		        pm.role, p.created_at AS "createdAt", p.updated_at AS "updatedAt",
		        count(t.id)::int AS "taskCount"
		 FROM projects p
		 JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
		 LEFT JOIN tasks t ON t.project_id = p.id
		 GROUP BY p.id, pm.role
		 ORDER BY p.updated_at DESC`,
		[user.id],
	);
	writeJson(response, 200, { projects: result.rows });
}

function defaultBackupSettings(projectId: string) {
	return {
		projectId,
		targetType: "none",
		syncMode: "manual",
		repositoryUrl: null,
		branch: null,
		lastSyncStatus: "never",
		lastSyncedAt: null,
		lastError: null,
	};
}

async function getProjectBackupSettings(
	database: Database,
	response: ServerResponse,
	user: AuthenticatedUser,
	projectId: string,
) {
	await projectRole(database, projectId, user.id);
	const result = await database.query(
		`SELECT project_id AS "projectId", target_type AS "targetType", sync_mode AS "syncMode",
		        repository_url AS "repositoryUrl", branch,
		        last_sync_status AS "lastSyncStatus", last_synced_at AS "lastSyncedAt",
		        last_error AS "lastError", updated_at AS "updatedAt"
		 FROM project_backup_settings WHERE project_id = $1`,
		[projectId],
	);
	writeJson(response, 200, { backup: result.rows[0] ?? defaultBackupSettings(projectId) });
}

async function updateProjectBackupSettings(
	database: Database,
	request: IncomingMessage,
	response: ServerResponse,
	user: AuthenticatedUser,
	projectId: string,
) {
	requireEditor(await projectRole(database, projectId, user.id));
	const body = await readJson(request);
	const targetType = textField(body, "targetType", { max: 30 });
	const requestedSyncMode = textField(body, "syncMode", { max: 30 });
	if (!backupTargetTypes.has(targetType)) throw new HttpError(400, "invalid_backup_target", "targetType is invalid");
	if (!backupSyncModes.has(requestedSyncMode)) throw new HttpError(400, "invalid_sync_mode", "syncMode is invalid");

	const syncMode = targetType === "none" ? "manual" : requestedSyncMode;
	const repositoryUrl = targetType === "github" ? optionalTextField(body, "repositoryUrl", 2048) : null;
	const branch = targetType === "github" ? optionalTextField(body, "branch", 200) ?? "main" : null;
	if (targetType === "github" && !repositoryUrl) {
		throw new HttpError(400, "github_repository_required", "repositoryUrl is required for GitHub backup");
	}
	if (repositoryUrl && !isGitHubRepositoryUrl(repositoryUrl)) {
		throw new HttpError(400, "invalid_github_repository", "repositoryUrl must be a credential-free GitHub repository URL");
	}
	if (branch && !isSafeGitBranch(branch)) {
		throw new HttpError(400, "invalid_backup_branch", "branch is invalid");
	}

	const result = await database.query(
		`INSERT INTO project_backup_settings (project_id, target_type, sync_mode, repository_url, branch)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (project_id) DO UPDATE
		 SET target_type = EXCLUDED.target_type,
		     sync_mode = EXCLUDED.sync_mode,
		     repository_url = EXCLUDED.repository_url,
		     branch = EXCLUDED.branch,
		     updated_at = now()
		 RETURNING project_id AS "projectId", target_type AS "targetType", sync_mode AS "syncMode",
		           repository_url AS "repositoryUrl", branch,
		           last_sync_status AS "lastSyncStatus", last_synced_at AS "lastSyncedAt",
		           last_error AS "lastError", updated_at AS "updatedAt"`,
		[projectId, targetType, syncMode, repositoryUrl, branch],
	);
	writeJson(response, 200, { backup: result.rows[0] });
}

async function createTask(
	database: Database,
	request: IncomingMessage,
	response: ServerResponse,
	user: AuthenticatedUser,
	projectId: string,
) {
	requireEditor(await projectRole(database, projectId, user.id));
	const body = await readJson(request);
	const title = textField(body, "title", { min: 1, max: 200 });
	const description = optionalTextField(body, "description", 50_000) ?? "";
	const aoSessionId = optionalTextField(body, "aoSessionId", 200);
	const status = aoSessionId ? "queued" : "draft";
	const result = await database.query(
		`INSERT INTO tasks (id, project_id, created_by, title, description, status, ao_session_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, project_id AS "projectId", title, description, status,
		           execution_target AS "executionTarget", ao_session_id AS "aoSessionId",
		           result_summary AS "resultSummary", created_at AS "createdAt", updated_at AS "updatedAt"`,
		[randomUUID(), projectId, user.id, title, description, status, aoSessionId],
	);
	writeJson(response, 201, { task: result.rows[0] });
}

async function listTasks(
	database: Database,
	response: ServerResponse,
	user: AuthenticatedUser,
	projectId: string,
) {
	await projectRole(database, projectId, user.id);
	const result = await database.query(
		`SELECT id, project_id AS "projectId", title, description, status,
		        execution_target AS "executionTarget", ao_session_id AS "aoSessionId",
		        result_summary AS "resultSummary", created_at AS "createdAt", updated_at AS "updatedAt"
		 FROM tasks WHERE project_id = $1 ORDER BY created_at DESC`,
		[projectId],
	);
	writeJson(response, 200, { tasks: result.rows });
}

async function updateTask(
	database: Database,
	request: IncomingMessage,
	response: ServerResponse,
	user: AuthenticatedUser,
	taskId: string,
) {
	const found = await database.query<{ project_id: string }>("SELECT project_id FROM tasks WHERE id = $1", [taskId]);
	const projectId = found.rows[0]?.project_id;
	if (!projectId) throw new HttpError(404, "task_not_found", "Task not found");
	requireEditor(await projectRole(database, projectId, user.id));
	const body = await readJson(request);
	const status = body.status;
	if (typeof status !== "string" || !taskStatuses.has(status)) throw new HttpError(400, "invalid_status", "status is invalid");
	const aoSessionId = optionalTextField(body, "aoSessionId", 200);
	const resultSummary = optionalTextField(body, "resultSummary", 50_000);
	const result = await database.query(
		`UPDATE tasks SET status = $2, ao_session_id = COALESCE($3, ao_session_id),
		 result_summary = COALESCE($4, result_summary), updated_at = now()
		 WHERE id = $1
		 RETURNING id, project_id AS "projectId", title, description, status,
		 execution_target AS "executionTarget", ao_session_id AS "aoSessionId",
		 result_summary AS "resultSummary", created_at AS "createdAt", updated_at AS "updatedAt"`,
		[taskId, status, aoSessionId, resultSummary],
	);
	writeJson(response, 200, { task: result.rows[0] });
}

function configureCors(request: IncomingMessage, response: ServerResponse, config: ServerConfig): void {
	const origin = request.headers.origin;
	if (origin && config.allowedOrigins.has(origin)) {
		response.setHeader("Access-Control-Allow-Origin", origin);
		response.setHeader("Vary", "Origin");
		response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
		response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS");
	}
}

export function createRequestHandler(database: Database, config: ServerConfig) {
	return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
		const requestId = randomUUID();
		response.setHeader("X-Request-Id", requestId);
		configureCors(request, response, config);
		if (request.method === "OPTIONS") {
			response.writeHead(204);
			response.end();
			return;
		}

		try {
			const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
			if (request.method === "GET" && url.pathname === "/health") {
				await database.query("SELECT 1");
				writeJson(response, 200, { status: "ok" });
				return;
			}
			if (request.method === "POST" && url.pathname === "/v1/auth/register") return await register(database, config, request, response);
			if (request.method === "POST" && url.pathname === "/v1/auth/login") return await login(database, config, request, response);

			const user = await authenticate(database, request);
			if (request.method === "GET" && url.pathname === "/v1/auth/me") {
				writeJson(response, 200, { user });
				return;
			}
			if (request.method === "POST" && url.pathname === "/v1/auth/logout") {
				await database.query("DELETE FROM account_sessions WHERE token_hash = $1", [hashAccessToken(bearerToken(request))]);
				writeJson(response, 200, { ok: true });
				return;
			}
			if (request.method === "GET" && url.pathname === "/v1/projects") return await listProjects(database, response, user);
			if (request.method === "POST" && url.pathname === "/v1/projects") return await createProject(database, request, response, user);

			const backupMatch = url.pathname.match(/^\/v1\/projects\/([0-9a-f-]+)\/backup$/i);
			if (backupMatch?.[1] && request.method === "GET") return await getProjectBackupSettings(database, response, user, backupMatch[1]);
			if (backupMatch?.[1] && request.method === "PUT") {
				return await updateProjectBackupSettings(database, request, response, user, backupMatch[1]);
			}

			const tasksMatch = url.pathname.match(/^\/v1\/projects\/([0-9a-f-]+)\/tasks$/i);
			if (tasksMatch?.[1] && request.method === "GET") return await listTasks(database, response, user, tasksMatch[1]);
			if (tasksMatch?.[1] && request.method === "POST") return await createTask(database, request, response, user, tasksMatch[1]);

			const taskMatch = url.pathname.match(/^\/v1\/tasks\/([0-9a-f-]+)$/i);
			if (taskMatch?.[1] && request.method === "PATCH") return await updateTask(database, request, response, user, taskMatch[1]);
			throw new HttpError(404, "not_found", "Endpoint not found");
		} catch (error) {
			if (error instanceof HttpError) {
				writeJson(response, error.status, { error: { code: error.code, message: error.message, requestId } });
				return;
			}
			console.error("AICodeRoom request failed", { requestId, error });
			writeJson(response, 500, { error: { code: "internal_error", message: "Internal server error", requestId } });
		}
	};
}

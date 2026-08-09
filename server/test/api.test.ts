import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import { Database, runMigrations } from "../src/database.js";
import { createRequestHandler } from "../src/http.js";

const databaseUrl = process.env.AICODEROOM_TEST_DATABASE_URL || "postgresql:///aicoderoom_dev";

type JsonResponse = { status: number; body: any };

async function request(baseUrl: string, path: string, options: { method?: string; token?: string; body?: unknown } = {}): Promise<JsonResponse> {
	const response = await fetch(`${baseUrl}${path}`, {
		method: options.method ?? "GET",
		headers: {
			...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
			...(options.body ? { "Content-Type": "application/json" } : {}),
		},
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	return { status: response.status, body: await response.json() };
}

test("real account, project and task data is persisted with member isolation", async (context) => {
	const schema = `test_${Date.now()}_${Math.random().toString(16).slice(2)}`;
	const database = new Database(databaseUrl, schema);
	const config = loadConfig({
		...process.env,
		AICODEROOM_DATABASE_URL: databaseUrl,
		AICODEROOM_DATABASE_SCHEMA: schema,
		AICODEROOM_SESSION_TTL_SECONDS: "3600",
	});
	await runMigrations(database);

	const server: Server = createServer(createRequestHandler(database, config));
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");
	const baseUrl = `http://127.0.0.1:${address.port}`;

	context.after(async () => {
		await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
		await database.query(`DROP SCHEMA \"${schema}\" CASCADE`);
		await database.close();
	});

	assert.deepEqual(await request(baseUrl, "/health"), { status: 200, body: { status: "ok" } });

	const alpha = await request(baseUrl, "/v1/auth/register", {
		method: "POST",
		body: { displayName: "Alpha", email: "alpha@example.test", password: "long-test-password" },
	});
	assert.equal(alpha.status, 201);
	assert.equal(alpha.body.user.email, "alpha@example.test");
	assert.equal(typeof alpha.body.accessToken, "string");

	const project = await request(baseUrl, "/v1/projects", {
		method: "POST",
		token: alpha.body.accessToken,
		body: { name: "真实项目", sourceKind: "local" },
	});
	assert.equal(project.status, 201);
	assert.equal(project.body.project.role, "owner");

	const defaultBackup = await request(baseUrl, `/v1/projects/${project.body.project.id}/backup`, {
		token: alpha.body.accessToken,
	});
	assert.equal(defaultBackup.status, 200);
	assert.equal(defaultBackup.body.backup.targetType, "none");
	assert.equal(defaultBackup.body.backup.lastSyncStatus, "never");

	const githubBackup = await request(baseUrl, `/v1/projects/${project.body.project.id}/backup`, {
		method: "PUT",
		token: alpha.body.accessToken,
		body: {
			targetType: "github",
			syncMode: "on_task_complete",
			repositoryUrl: "git@github.com:alpha/real-project.git",
			branch: "main",
		},
	});
	assert.equal(githubBackup.status, 200);
	assert.equal(githubBackup.body.backup.targetType, "github");
	assert.equal(githubBackup.body.backup.syncMode, "on_task_complete");
	assert.equal(githubBackup.body.backup.repositoryUrl, "git@github.com:alpha/real-project.git");
	assert.equal(
		(await request(baseUrl, `/v1/projects/${project.body.project.id}/backup`, { token: alpha.body.accessToken })).body.backup.branch,
		"main",
	);
	const credentialInUrl = await request(baseUrl, `/v1/projects/${project.body.project.id}/backup`, {
		method: "PUT",
		token: alpha.body.accessToken,
		body: {
			targetType: "github",
			syncMode: "manual",
			repositoryUrl: "https://token@github.com/alpha/real-project.git",
			branch: "main",
		},
	});
	assert.equal(credentialInUrl.status, 400);
	assert.equal(credentialInUrl.body.error.code, "invalid_github_repository");

	const task = await request(baseUrl, `/v1/projects/${project.body.project.id}/tasks`, {
		method: "POST",
		token: alpha.body.accessToken,
		body: { title: "让 AI 完成功能", description: "这是持久化任务", aoSessionId: "ao-session-1" },
	});
	assert.equal(task.status, 201);
	assert.equal(task.body.task.status, "queued");

	const listed = await request(baseUrl, `/v1/projects/${project.body.project.id}/tasks`, { token: alpha.body.accessToken });
	assert.equal(listed.status, 200);
	assert.equal(listed.body.tasks.length, 1);
	assert.equal(listed.body.tasks[0].title, "让 AI 完成功能");

	const beta = await request(baseUrl, "/v1/auth/register", {
		method: "POST",
		body: { displayName: "Beta", email: "beta@example.test", password: "another-test-password" },
	});
	assert.equal(beta.status, 201);
	assert.deepEqual((await request(baseUrl, "/v1/projects", { token: beta.body.accessToken })).body.projects, []);
	assert.equal(
		(await request(baseUrl, `/v1/projects/${project.body.project.id}/tasks`, { token: beta.body.accessToken })).status,
		404,
	);
	assert.equal(
		(await request(baseUrl, `/v1/projects/${project.body.project.id}/backup`, { token: beta.body.accessToken })).status,
		404,
	);

	const wrongPassword = await request(baseUrl, "/v1/auth/login", {
		method: "POST",
		body: { email: "alpha@example.test", password: "not-the-right-password" },
	});
	assert.equal(wrongPassword.status, 401);

	assert.equal((await request(baseUrl, "/v1/auth/logout", { method: "POST", token: alpha.body.accessToken })).status, 200);
	assert.equal((await request(baseUrl, "/v1/auth/me", { token: alpha.body.accessToken })).status, 401);
});

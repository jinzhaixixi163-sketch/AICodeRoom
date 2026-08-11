import { aoBridge } from "./bridge";
import { uiText } from "../i18n/localized-ui";

export type AccountUser = {
	id: string;
	email: string;
	displayName: string;
};

export type AccountProject = {
	id: string;
	name: string;
	sourceKind: "local" | "git" | "uploaded";
	clientProjectId?: string | null;
	role: "owner" | "editor" | "viewer";
};

export type BackupTargetType = "none" | "local_mirror" | "github";
export type BackupSyncMode = "manual" | "on_task_complete" | "continuous";

export type ProjectBackupSettings = {
	projectId: string;
	targetType: BackupTargetType;
	syncMode: BackupSyncMode;
	repositoryUrl: string | null;
	branch: string | null;
	lastSyncStatus: "never" | "ready" | "syncing" | "succeeded" | "failed";
	lastSyncedAt: string | null;
	lastError: string | null;
};

type ApiErrorBody = { error?: { code?: string; message?: string } };

export class ControlPlaneError extends Error {
	constructor(
		message: string,
		readonly code?: string,
		readonly status?: number,
	) {
		super(message);
		this.name = "ControlPlaneError";
	}
}

// The open-source desktop app is local-first and has no AICodeRoom account
// gate. A separately deployed collaboration control plane is opt-in: only an
// explicit URL enables network-backed projects, tasks, and backup metadata.
const configuredBaseUrl = import.meta.env.VITE_AICODEROOM_API_URL?.trim();
const baseUrl = configuredBaseUrl?.replace(/\/+$/, "") ?? "";
const controlPlaneEnabled = baseUrl !== "";
const rendererTestMode = import.meta.env.MODE === "test";

function localProject(input: { clientProjectId: string; name: string }): AccountProject {
	return {
		id: `local:${input.clientProjectId}`,
		name: input.name,
		sourceKind: "local",
		clientProjectId: input.clientProjectId,
		role: "owner",
	};
}

function defaultLocalBackup(projectId: string): ProjectBackupSettings {
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

function localBackupKey(projectId: string): string {
	return `aicoderoom.backup.settings.${projectId}`;
}

function readLocalBackup(projectId: string): ProjectBackupSettings {
	try {
		const raw = window.localStorage.getItem(localBackupKey(projectId));
		if (raw) {
			return {
				...defaultLocalBackup(projectId),
				...(JSON.parse(raw) as Partial<ProjectBackupSettings>),
				projectId,
			};
		}
	} catch {
		// A corrupt local preference must not prevent the project from opening.
	}
	return defaultLocalBackup(projectId);
}

function writeLocalBackup(settings: ProjectBackupSettings): ProjectBackupSettings {
	window.localStorage.setItem(localBackupKey(settings.projectId), JSON.stringify(settings));
	return settings;
}

async function request<T>(
	path: string,
	options: { method?: string; body?: unknown; authenticated?: boolean } = {},
): Promise<T> {
	if (!controlPlaneEnabled) {
		throw new ControlPlaneError(uiText("AICodeRoom Server is unavailable"), "server_unavailable");
	}
	const token = options.authenticated === false ? null : await aoBridge.account.getToken();
	if (options.authenticated !== false && !token)
		throw new ControlPlaneError(uiText("Please sign in"), "authentication_required", 401);
	let response: Response;
	try {
		response = await fetch(`${baseUrl}${path}`, {
			method: options.method ?? "GET",
			headers: {
				Accept: "application/json",
				...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: options.body === undefined ? undefined : JSON.stringify(options.body),
		});
	} catch {
		throw new ControlPlaneError(uiText("AICodeRoom Server is unavailable"), "server_unavailable");
	}
	const payload = (await response.json().catch(() => ({}))) as ApiErrorBody & T;
	if (!response.ok) {
		throw new ControlPlaneError(
			uiText(payload.error?.message || "Request failed"),
			payload.error?.code,
			response.status,
		);
	}
	return payload;
}

export async function signIn(email: string, password: string): Promise<AccountUser> {
	const result = await request<{ accessToken: string; user: AccountUser }>("/v1/auth/login", {
		method: "POST",
		authenticated: false,
		body: { email, password },
	});
	await aoBridge.account.setToken(result.accessToken);
	return result.user;
}

export async function register(displayName: string, email: string, password: string): Promise<AccountUser> {
	const result = await request<{ accessToken: string; user: AccountUser }>("/v1/auth/register", {
		method: "POST",
		authenticated: false,
		body: { displayName, email, password },
	});
	await aoBridge.account.setToken(result.accessToken);
	return result.user;
}

export async function currentUser(): Promise<AccountUser | null> {
	if (!(await aoBridge.account.getToken())) return null;
	try {
		return (await request<{ user: AccountUser }>("/v1/auth/me")).user;
	} catch (error) {
		if (error instanceof ControlPlaneError && error.status === 401) {
			await aoBridge.account.clearToken();
			return null;
		}
		throw error;
	}
}

export async function signOut(): Promise<void> {
	try {
		await request<{ ok: true }>("/v1/auth/logout", { method: "POST" });
	} finally {
		await aoBridge.account.clearToken();
	}
}

export async function ensureControlPlaneProject(input: {
	clientProjectId: string;
	name: string;
	repositoryUrl?: string;
}): Promise<AccountProject> {
	if (rendererTestMode || !controlPlaneEnabled) return localProject(input);
	return (
		await request<{ project: AccountProject }>("/v1/projects", {
			method: "POST",
			body: {
				name: input.name,
				sourceKind: "local",
				clientProjectId: input.clientProjectId,
				repositoryUrl: input.repositoryUrl,
			},
		})
	).project;
}

export async function getProjectBackupSettings(projectId: string): Promise<ProjectBackupSettings> {
	if (rendererTestMode) return defaultLocalBackup(projectId);
	if (!controlPlaneEnabled) return readLocalBackup(projectId);
	return (await request<{ backup: ProjectBackupSettings }>(`/v1/projects/${encodeURIComponent(projectId)}/backup`))
		.backup;
}

export async function updateProjectBackupSettings(
	projectId: string,
	input: Pick<ProjectBackupSettings, "targetType" | "syncMode" | "repositoryUrl" | "branch">,
): Promise<ProjectBackupSettings> {
	if (rendererTestMode || !controlPlaneEnabled) {
		const settings: ProjectBackupSettings = {
			projectId,
			...input,
			lastSyncStatus: "never",
			lastSyncedAt: null,
			lastError: null,
		};
		return rendererTestMode ? settings : writeLocalBackup(settings);
	}
	return (
		await request<{ backup: ProjectBackupSettings }>(`/v1/projects/${encodeURIComponent(projectId)}/backup`, {
			method: "PUT",
			body: input,
		})
	).backup;
}

export async function createControlPlaneTask(input: {
	clientProjectId: string;
	projectName: string;
	title: string;
	description: string;
	aoSessionId?: string;
}): Promise<string> {
	if (rendererTestMode) return `test-task:${input.aoSessionId ?? "draft"}`;
	if (!controlPlaneEnabled) return `local-task:${crypto.randomUUID()}`;
	const project = await ensureControlPlaneProject({
		clientProjectId: input.clientProjectId,
		name: input.projectName,
	});
	const result = await request<{ task: { id: string } }>(`/v1/projects/${encodeURIComponent(project.id)}/tasks`, {
		method: "POST",
		body: {
			title: input.title,
			description: input.description,
			aoSessionId: input.aoSessionId,
		},
	});
	return result.task.id;
}

export async function updateControlPlaneTask(
	taskId: string,
	input: {
		status: "queued" | "running" | "needs_input" | "completed" | "failed" | "cancelled";
		aoSessionId?: string;
		resultSummary?: string;
	},
): Promise<void> {
	if (rendererTestMode || !controlPlaneEnabled || taskId.startsWith("local-task:")) return;
	await request(`/v1/tasks/${encodeURIComponent(taskId)}`, {
		method: "PATCH",
		body: input,
	});
}

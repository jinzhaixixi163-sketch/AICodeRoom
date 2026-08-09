import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { ensureProjectMock, getBackupMock, updateBackupMock } = vi.hoisted(() => ({
	ensureProjectMock: vi.fn(),
	getBackupMock: vi.fn(),
	updateBackupMock: vi.fn(),
}));

vi.mock("../lib/control-plane-client", () => ({
	ensureControlPlaneProject: ensureProjectMock,
	getProjectBackupSettings: getBackupMock,
	updateProjectBackupSettings: updateBackupMock,
}));

import { ProjectBackupSettings } from "./ProjectBackupSettings";

function renderSettings() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	render(
		<QueryClientProvider client={queryClient}>
			<ProjectBackupSettings projectId="local-project-1" projectName="Project One" />
		</QueryClientProvider>,
	);
}

beforeEach(() => {
	ensureProjectMock.mockReset();
	getBackupMock.mockReset();
	updateBackupMock.mockReset();
	ensureProjectMock.mockResolvedValue({ id: "account-project-1" });
	getBackupMock.mockResolvedValue({
		projectId: "account-project-1",
		targetType: "none",
		syncMode: "manual",
		repositoryUrl: null,
		branch: null,
		lastSyncStatus: "never",
		lastSyncedAt: null,
		lastError: null,
	});
	updateBackupMock.mockImplementation(async (projectId, input) => ({
		projectId,
		...input,
		lastSyncStatus: "never",
		lastSyncedAt: null,
		lastError: null,
	}));
});

describe("ProjectBackupSettings", () => {
	it("persists a GitHub target without sending credentials", async () => {
		renderSettings();

		const target = await screen.findByLabelText("Backup target");
		await userEvent.selectOptions(target, "github");
		await userEvent.type(screen.getByLabelText("GitHub repository"), "git@github.com:owner/project-one.git");
		await userEvent.selectOptions(screen.getByLabelText("Sync timing"), "on_task_complete");
		await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() => expect(updateBackupMock).toHaveBeenCalledTimes(1));
		expect(updateBackupMock).toHaveBeenCalledWith("account-project-1", {
			targetType: "github",
			syncMode: "on_task_complete",
			repositoryUrl: "git@github.com:owner/project-one.git",
			branch: "main",
		});
		expect(screen.getByText("Backup policy saved.")).toBeInTheDocument();
	});
});

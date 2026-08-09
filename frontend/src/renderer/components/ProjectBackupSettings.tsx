import { useMutation, useQuery } from "@tanstack/react-query";
import { Cloud, FolderGit2, FolderSync, HardDrive, RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ensureControlPlaneProject,
	getProjectBackupSettings,
	updateProjectBackupSettings,
	type BackupSyncMode,
	type BackupTargetType,
} from "../lib/control-plane-client";
import { aoBridge } from "../lib/bridge";
import { SettingsRow } from "./settings/SettingsRow";
import { SettingsSection } from "./settings/SettingsSection";
import { Button } from "./ui/button";

const localTargetKey = (projectId: string) => `aicoderoom.backup.local-target.${projectId}`;

type BackupForm = {
	targetType: BackupTargetType;
	syncMode: BackupSyncMode;
	repositoryUrl: string;
	branch: string;
};

export function ProjectBackupSettings({
	projectId,
	projectName,
	repositoryUrl,
}: {
	projectId: string;
	projectName: string;
	repositoryUrl?: string;
}) {
	const { t } = useTranslation();
	const [localTarget, setLocalTarget] = useState(() => window.localStorage.getItem(localTargetKey(projectId)) ?? "");
	const [validationError, setValidationError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const [form, setForm] = useState<BackupForm>({
		targetType: "none",
		syncMode: "manual",
		repositoryUrl: repositoryUrl ?? "",
		branch: "main",
	});

	const query = useQuery({
		queryKey: ["control-plane-project-backup", projectId],
		queryFn: async () => {
			const accountProject = await ensureControlPlaneProject({
				clientProjectId: projectId,
				name: projectName,
				repositoryUrl,
			});
			return getProjectBackupSettings(accountProject.id);
		},
	});

	useEffect(() => {
		if (!query.data) return;
		setForm({
			targetType: query.data.targetType,
			syncMode: query.data.syncMode,
			repositoryUrl: query.data.repositoryUrl ?? repositoryUrl ?? "",
			branch: query.data.branch ?? "main",
		});
	}, [query.data, repositoryUrl]);

	const mutation = useMutation({
		mutationFn: async () => {
			if (!query.data) throw new Error(t("settings.project.backupLoadFailed"));
			if (form.targetType === "local_mirror" && localTarget.trim() === "") {
				throw new Error(t("settings.project.backupLocalFolderRequired"));
			}
			if (form.targetType === "github" && form.repositoryUrl.trim() === "") {
				throw new Error(t("settings.project.backupGithubRepoRequired"));
			}
			if (form.targetType === "local_mirror") {
				window.localStorage.setItem(localTargetKey(projectId), localTarget);
			} else {
				window.localStorage.removeItem(localTargetKey(projectId));
			}
			return updateProjectBackupSettings(query.data.projectId, {
				targetType: form.targetType,
				syncMode: form.targetType === "none" ? "manual" : form.syncMode,
				repositoryUrl: form.targetType === "github" ? form.repositoryUrl.trim() : null,
				branch: form.targetType === "github" ? form.branch.trim() || "main" : null,
			});
		},
		onSuccess: (backup) => {
			setForm((current) => ({
				...current,
				targetType: backup.targetType,
				syncMode: backup.syncMode,
			}));
			setValidationError(null);
			setSaved(true);
		},
		onError: (error) => {
			setValidationError(error instanceof Error ? error.message : t("settings.project.backupSaveFailed"));
			setSaved(false);
		},
	});

	if (query.isLoading) return <p className="text-sm text-settings-muted">{t("settings.project.backupLoading")}</p>;
	if (query.isError || !query.data) {
		return (
			<p className="text-sm text-error">
				{query.error instanceof Error ? query.error.message : t("settings.project.backupLoadFailed")}
			</p>
		);
	}

	return (
		<form
			className="flex w-full flex-col gap-(--size-settings-section-gap)"
			onSubmit={(event) => {
				event.preventDefault();
				setSaved(false);
				setValidationError(null);
				mutation.mutate();
			}}
		>
			<SettingsSection title={t("settings.project.backupProtection")}>
				<p className="px-1 text-xs leading-row text-settings-muted">{t("settings.project.backupDescription")}</p>
				<SettingsRow icon={Cloud} label={t("settings.project.backupTarget")}>
					<select
						aria-label={t("settings.project.backupTarget")}
						className="settings-inline-input w-56"
						value={form.targetType}
						onChange={(event) => {
							setSaved(false);
							setForm((current) => ({ ...current, targetType: event.target.value as BackupTargetType }));
						}}
					>
						<option value="none">{t("settings.project.backupTargetDevice")}</option>
						<option value="local_mirror">{t("settings.project.backupTargetLocal")}</option>
						<option value="github">{t("settings.project.backupTargetGithub")}</option>
					</select>
				</SettingsRow>

				{form.targetType === "local_mirror" && (
					<SettingsRow icon={FolderSync} label={t("settings.project.backupLocalFolder")}>
						<div className="flex max-w-md items-center gap-2">
							<span className="settings-row-value min-w-0 truncate" title={localTarget}>
								{localTarget || t("settings.project.backupLocalFolderEmpty")}
							</span>
							<Button
								type="button"
								variant="outline"
								onClick={async () => {
									const selected = await aoBridge.app.chooseDirectory(t("settings.project.backupChooseFolder"));
									if (selected) {
										setLocalTarget(selected);
										setSaved(false);
									}
								}}
							>
								{t("settings.project.backupChooseFolder")}
							</Button>
						</div>
					</SettingsRow>
				)}

				{form.targetType === "github" && (
					<>
						<SettingsRow icon={FolderGit2} label={t("settings.project.backupGithubRepo")}>
							<input
								aria-label={t("settings.project.backupGithubRepo")}
								className="settings-inline-input w-72"
								placeholder={t("settings.project.backupGithubRepoPlaceholder")}
								value={form.repositoryUrl}
								onChange={(event) => {
									setSaved(false);
									setForm((current) => ({ ...current, repositoryUrl: event.target.value }));
								}}
							/>
						</SettingsRow>
						<SettingsRow icon={HardDrive} label={t("settings.project.backupBranch")}>
							<input
								aria-label={t("settings.project.backupBranch")}
								className="settings-inline-input w-48"
								placeholder={t("settings.project.backupBranchPlaceholder")}
								value={form.branch}
								onChange={(event) => {
									setSaved(false);
									setForm((current) => ({ ...current, branch: event.target.value }));
								}}
							/>
						</SettingsRow>
						<p className="px-1 text-xs leading-row text-warning">{t("settings.project.backupGithubAuthNotice")}</p>
					</>
				)}

				{form.targetType !== "none" && (
					<SettingsRow icon={RefreshCw} label={t("settings.project.backupSyncMode")}>
						<select
							aria-label={t("settings.project.backupSyncMode")}
							className="settings-inline-input w-56"
							value={form.syncMode}
							onChange={(event) => {
								setSaved(false);
								setForm((current) => ({ ...current, syncMode: event.target.value as BackupSyncMode }));
							}}
						>
							<option value="manual">{t("settings.project.backupSyncManual")}</option>
							<option value="on_task_complete">{t("settings.project.backupSyncTask")}</option>
							<option value="continuous">{t("settings.project.backupSyncContinuous")}</option>
						</select>
					</SettingsRow>
				)}
			</SettingsSection>

			<div className="flex flex-col items-start gap-1.5">
				<Button type="submit" variant="footer-primary" disabled={mutation.isPending}>
					{mutation.isPending ? t("settings.project.saving") : t("settings.project.saveChanges")}
				</Button>
				{validationError && (
					<span className="inline-flex items-center gap-1.5 text-xs text-error">
						<TriangleAlert className="size-3 shrink-0" aria-hidden="true" />
						{validationError}
					</span>
				)}
				{saved && <span className="text-xs text-success">{t("settings.project.backupPolicySaved")}</span>}
				<span className="text-xs text-settings-muted">{t("settings.project.backupExecutionPending")}</span>
			</div>
		</form>
	);
}

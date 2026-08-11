import { useState } from "react";
import { Bot, KeyRound, Loader2, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	type AIAccount,
	type AIAccountHarness,
	useAIAccounts,
	useCreateAIAccount,
	useClearAIAccountCredential,
	useLoginAIAccount,
	useSetAIAccountCredential,
	useSetAIAccountEnabled,
} from "../../hooks/useAIAccounts";
import { apiErrorMessage } from "../../lib/api-client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ConfirmDialog } from "../ConfirmDialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { SettingsSection } from "./SettingsSection";
import { cn } from "../../lib/utils";

export function AIAccountsSection({ titleHidden }: { titleHidden?: boolean }) {
	const { t } = useTranslation();
	const accounts = useAIAccounts();
	const create = useCreateAIAccount();
	const login = useLoginAIAccount();
	const setCredential = useSetAIAccountCredential();
	const clearCredential = useClearAIAccountCredential();
	const setEnabled = useSetAIAccountEnabled();
	const [tokenAccount, setTokenAccount] = useState<AIAccount | null>(null);
	const [clearAccount, setClearAccount] = useState<AIAccount | null>(null);
	const busy = create.isPending || login.isPending || setCredential.isPending || clearCredential.isPending || setEnabled.isPending;

	const add = (harness: AIAccountHarness) => {
		const number = (accounts.data?.filter((account) => account.harness === harness).length ?? 0) + 1;
		create.mutate({ harness, label: t(`settings.aiAccounts.defaultLabel.${harness}`, { number }) });
	};

	const error = create.error ?? login.error ?? setCredential.error ?? clearCredential.error ?? setEnabled.error ?? accounts.error;
	return (
		<SettingsSection title={t("settings.aiAccounts.title")} titleHidden={titleHidden}>
			<div className="rounded-lg border border-border bg-card/45 p-4">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<p className="text-sm font-semibold text-foreground">{t("settings.aiAccounts.heading")}</p>
						<p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
							{t("settings.aiAccounts.description")}
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={accounts.isFetching}
						onClick={() => void accounts.refetch()}
					>
						<RefreshCw className={cn("size-3.5", accounts.isFetching && "animate-spin")} aria-hidden="true" />
						{t("settings.aiAccounts.refresh")}
					</Button>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-2">
					<Button type="button" variant="outline" disabled={busy} onClick={() => add("codex")}>
						<Plus className="size-4" aria-hidden="true" />
						{t("settings.aiAccounts.addCodex")}
					</Button>
					<Button type="button" variant="outline" disabled={busy} onClick={() => add("claude-code")}>
						<Plus className="size-4" aria-hidden="true" />
						{t("settings.aiAccounts.addClaude")}
					</Button>
				</div>
			</div>

			{accounts.isLoading ? (
				<div className="flex items-center gap-2 rounded-lg border border-border px-4 py-5 text-sm text-muted-foreground">
					<Loader2 className="size-4 animate-spin" aria-hidden="true" />
					{t("settings.aiAccounts.loading")}
				</div>
			) : null}

			{!accounts.isLoading && (accounts.data?.length ?? 0) === 0 ? (
				<div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
					{t("settings.aiAccounts.empty")}
				</div>
			) : null}

			{accounts.data?.map((account) => (
				<AccountRow
					key={account.id}
					account={account}
					busy={busy}
					onLogin={() => account.harness === "claude-code" ? setTokenAccount(account) : login.mutate(account.id)}
					onClear={() => setClearAccount(account)}
					onToggle={() => setEnabled.mutate({ id: account.id, enabled: !account.enabled })}
				/>
			))}

			{error ? (
				<p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
					{error instanceof Error ? error.message : apiErrorMessage(error)}
				</p>
			) : null}
			<p className="px-1 text-xs leading-relaxed text-muted-foreground">{t("settings.aiAccounts.security")}</p>

			{tokenAccount ? (
				<ClaudeTokenDialog
					account={tokenAccount}
					busy={setCredential.isPending}
					onOpenChange={(open) => { if (!open) setTokenAccount(null); }}
					onSave={(token) => {
						setCredential.mutate({ id: tokenAccount.id, token }, { onSuccess: () => setTokenAccount(null) });
					}}
				/>
			) : null}
			<ConfirmDialog
				open={clearAccount !== null}
				title={t("settings.aiAccounts.clearTitle")}
				description={t("settings.aiAccounts.clearDescription", { label: clearAccount?.label ?? "" })}
				confirmLabel={t("settings.aiAccounts.clearConfirm")}
				destructive
				busy={clearCredential.isPending}
				onConfirm={() => {
					if (!clearAccount) return;
					clearCredential.mutate(clearAccount.id, { onSuccess: () => setClearAccount(null) });
				}}
				onOpenChange={(open) => { if (!open) setClearAccount(null); }}
			/>
		</SettingsSection>
	);
}

function AccountRow({
	account,
	busy,
	onLogin,
	onClear,
	onToggle,
}: {
	account: AIAccount;
	busy: boolean;
	onLogin: () => void;
	onClear: () => void;
	onToggle: () => void;
}) {
	const { t } = useTranslation();
	const Icon = account.harness === "codex" ? Bot : KeyRound;
	const authenticated = account.authStatus === "authenticated";
	const authenticating = account.authStatus === "authenticating";
	return (
		<div className="flex items-center gap-3 rounded-lg border border-border bg-card/45 px-4 py-3">
			<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-foreground">
				<Icon className="size-4" aria-hidden="true" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<p className="truncate text-sm font-medium text-foreground">{account.label}</p>
					<span className="rounded-full bg-surface px-2 py-0.5 text-2xs text-muted-foreground">
						{account.harness === "codex" ? "GPT / Codex" : "Claude"}
					</span>
				</div>
				<p className={cn("mt-0.5 text-xs", authenticated ? "text-success" : "text-muted-foreground")}>
					{t(`settings.aiAccounts.status.${account.authStatus}`)}
				</p>
			</div>
			<Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onToggle}>
				{account.enabled ? t("settings.aiAccounts.disable") : t("settings.aiAccounts.enable")}
			</Button>
			{account.credentialConfigured ? (
				<Button type="button" variant="ghost" size="icon" disabled={busy} onClick={onClear} title={t("settings.aiAccounts.clearCredential")}>
					<Trash2 className="size-3.5" aria-hidden="true" />
					<span className="sr-only">{t("settings.aiAccounts.clearCredential")}</span>
				</Button>
			) : null}
			<Button type="button" variant="outline" size="sm" disabled={busy || authenticating} onClick={onLogin}>
				{authenticating ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
				{account.harness === "claude-code"
					? (account.credentialConfigured ? t("settings.aiAccounts.replaceToken") : t("settings.aiAccounts.setToken"))
					: (authenticated ? t("settings.aiAccounts.relogin") : t("settings.aiAccounts.login"))}
			</Button>
		</div>
	);
}

function ClaudeTokenDialog({
	account,
	busy,
	onOpenChange,
	onSave,
}: {
	account: AIAccount;
	busy: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (token: string) => void;
}) {
	const { t } = useTranslation();
	const [token, setToken] = useState("");
	return (
		<Dialog open onOpenChange={(open) => {
			if (!open) setToken("");
			onOpenChange(open);
		}}>
			<DialogContent>
				<DialogHeader>
					<div className="mb-1 grid size-10 place-items-center rounded-xl bg-success/10 text-success">
						<ShieldCheck className="size-5" aria-hidden="true" />
					</div>
					<DialogTitle>{t("settings.aiAccounts.tokenTitle", { label: account.label })}</DialogTitle>
					<DialogDescription>{t("settings.aiAccounts.tokenDescription")}</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<p className="rounded-md border border-border bg-surface/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
						{t("settings.aiAccounts.tokenSteps")}
					</p>
					<Input
						type="password"
						autoComplete="off"
						value={token}
						onChange={(event) => setToken(event.target.value)}
						placeholder={t("settings.aiAccounts.tokenPlaceholder")}
						aria-label={t("settings.aiAccounts.tokenPlaceholder")}
					/>
					<p className="text-xs leading-relaxed text-muted-foreground">{t("settings.aiAccounts.tokenSecurity")}</p>
				</div>
				<DialogFooter className="flex-row justify-end">
					<Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
						{t("confirm.cancel")}
					</Button>
					<Button type="button" disabled={busy || token.trim().length === 0} onClick={() => onSave(token)}>
						{busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
						{t("settings.aiAccounts.saveToken")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

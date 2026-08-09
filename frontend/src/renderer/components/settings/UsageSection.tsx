import { AlertTriangle, Bot, Database, RefreshCw, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSessionUsageSummaries } from "../../hooks/useSessionUsageSummaries";
import { useUsageOverview, type UsageOverview } from "../../hooks/useUsageOverview";
import { useWorkspaceQuery } from "../../hooks/useWorkspaceQuery";
import { formatTokenCount } from "../../lib/format-token-count";
import { cn } from "../../lib/utils";
import type { WorkspaceSession } from "../../types/workspace";
import { SettingsSection } from "./SettingsSection";

export function UsageSection({ titleHidden = false }: { titleHidden?: boolean }) {
	const { t } = useTranslation();
	const overviewQuery = useUsageOverview();
	const sessionsQuery = useSessionUsageSummaries();
	const workspaceQuery = useWorkspaceQuery();
	const overview = overviewQuery.data;
	const usageBySession = sessionsQuery.data;
	const sessions = (workspaceQuery.data ?? []).flatMap((workspace) => workspace.sessions);
	const sessionRows = usageBySession
		? [...usageBySession.values()]
				.filter((usage) => usage.totalTokens > 0)
				.map((usage) => ({ usage, session: sessions.find((session) => session.id === usage.sessionId) }))
				.sort((a, b) => b.usage.totalTokens - a.usage.totalTokens)
				.slice(0, 8)
		: [];
	const isLoading = overviewQuery.isLoading || sessionsQuery.isLoading;
	const hasError = overviewQuery.isError || sessionsQuery.isError;

	const refresh = () => {
		void Promise.all([overviewQuery.refetch(), sessionsQuery.refetch(), workspaceQuery.refetch()]);
	};

	return (
		<SettingsSection title={t("settings.usage.title")} titleHidden={titleHidden} sectionId="usage">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-sm text-settings-label">{t("settings.usage.subtitle")}</p>
					<p className="mt-1 text-xs leading-relaxed text-settings-muted">{t("settings.usage.description")}</p>
				</div>
				<button
					aria-label={t("settings.usage.refresh")}
					className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-(--color-border-settings-input) text-settings-muted transition-colors hover:bg-interactive-hover hover:text-settings-label disabled:opacity-50"
					disabled={overviewQuery.isFetching || sessionsQuery.isFetching}
					onClick={refresh}
					type="button"
				>
					<RefreshCw className={cn("size-3.5", (overviewQuery.isFetching || sessionsQuery.isFetching) && "animate-spin")} />
				</button>
			</div>

			{isLoading ? <UsageStateCard>{t("settings.usage.loading")}</UsageStateCard> : null}
			{hasError ? (
				<UsageStateCard tone="error">
					<AlertTriangle className="size-4" />
					{t("settings.usage.loadFailed")}
				</UsageStateCard>
			) : null}
			{!isLoading && !hasError && overview ? (
				<>
					<UsageHero overview={overview} />
					<MetricGrid overview={overview} />
					<ProviderUsage overview={overview} />
					<SessionUsage rows={sessionRows} />
				</>
			) : null}
		</SettingsSection>
	);
}

function UsageHero({ overview }: { overview: UsageOverview }) {
	const { t } = useTranslation();
	const input = overview.totals.inputTokens ?? 0;
	const output = overview.totals.outputTokens ?? 0;
	const total = input + output;
	const inputPercent = total > 0 ? (input / total) * 100 : 0;
	const outputPercent = total > 0 ? 100 - inputPercent : 0;

	return (
		<div className="overflow-hidden rounded-xl border border-(--color-border-settings-input) bg-(--color-bg-settings-input) p-4" data-testid="usage-overview">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-medium text-settings-muted">{t("settings.usage.total")}</p>
					<p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-settings-label" aria-label={t("settings.usage.totalExact", { count: total.toLocaleString("en-US") })}>
						{formatLargeTokenCount(total)}
					</p>
				</div>
				<div className="rounded-lg bg-background/70 px-3 py-2 text-right">
					<p className="text-2xs text-settings-muted">{t("settings.usage.trackedSessions")}</p>
					<p className="mt-0.5 font-mono text-sm font-semibold text-settings-label">{overview.sessionCount}</p>
				</div>
			</div>
			<div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted" aria-label={t("settings.usage.compositionAria")}>
				<div className="bg-sky-500" style={{ width: `${inputPercent}%` }} title={t("settings.usage.input")} />
				<div className="bg-violet-500" style={{ width: `${outputPercent}%` }} title={t("settings.usage.output")} />
			</div>
			<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-settings-muted">
				<LegendDot className="bg-sky-500" label={t("settings.usage.input")} value={input} />
				<LegendDot className="bg-violet-500" label={t("settings.usage.output")} value={output} />
				{overview.incompleteSessionCount > 0 ? (
					<span className="ml-auto inline-flex items-center gap-1 text-amber-500">
						<AlertTriangle className="size-3" />
						{t("settings.usage.incompleteSessions", { count: overview.incompleteSessionCount })}
					</span>
				) : null}
			</div>
		</div>
	);
}

function MetricGrid({ overview }: { overview: UsageOverview }) {
	const { t } = useTranslation();
	const cached = (overview.totals.cacheReadTokens ?? 0) + (overview.totals.cacheWriteTokens ?? 0);
	return (
		<div className="grid grid-cols-2 gap-2">
			<MetricCard icon={Database} label={t("settings.usage.input")} value={overview.totals.inputTokens} />
			<MetricCard icon={Sparkles} label={t("settings.usage.cachedInput")} value={cached} />
			<MetricCard icon={Bot} label={t("settings.usage.output")} value={overview.totals.outputTokens} />
			<MetricCard icon={Sparkles} label={t("settings.usage.reasoning")} value={overview.totals.reasoningTokens} optional />
		</div>
	);
}

function MetricCard({ icon: Icon, label, value, optional = false }: { icon: typeof Bot; label: string; value: number | null; optional?: boolean }) {
	const { t } = useTranslation();
	return (
		<div className="rounded-lg border border-(--color-border-settings-input) bg-(--color-bg-settings-input) p-3">
			<div className="flex items-center gap-2 text-settings-muted"><Icon className="size-3.5" /><span className="text-xs">{label}</span></div>
			<p className="mt-2 font-mono text-base font-semibold text-settings-label">{value === null && optional ? "—" : localizedTokenCount(value ?? 0, t("settings.usage.tokenUnit"))}</p>
			{value === null && optional ? <p className="mt-1 text-2xs text-settings-muted">{t("settings.usage.notReported")}</p> : null}
		</div>
	);
}

function ProviderUsage({ overview }: { overview: UsageOverview }) {
	const { t } = useTranslation();
	const rows = overview.harnesses.map((harness) => ({
		name: formatHarnessName(harness.harness),
		total: tokenTotal(harness.totals),
		models: harness.models.map((model) => model.modelId).filter(Boolean),
	}));
	const max = Math.max(...rows.map((row) => row.total), 1);
	return (
		<div className="rounded-xl border border-(--color-border-settings-input) bg-(--color-bg-settings-input) p-4">
			<h3 className="text-xs font-semibold text-settings-label">{t("settings.usage.byAgent")}</h3>
			{rows.length === 0 ? <p className="mt-3 text-xs text-settings-muted">{t("settings.usage.empty")}</p> : (
				<div className="mt-3 space-y-3">{rows.map((row) => (
					<div key={row.name}>
						<div className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-settings-label">{row.name}<span className="ml-2 text-2xs text-settings-muted">{row.models.join(" · ")}</span></span><span className="shrink-0 font-mono text-settings-label">{localizedTokenCount(row.total, t("settings.usage.tokenUnit"))}</span></div>
						<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(row.total / max) * 100}%` }} /></div>
					</div>
				))}</div>
			)}
		</div>
	);
}

function SessionUsage({ rows }: { rows: Array<{ usage: { sessionId: string; totalTokens: number; incomplete: boolean }; session?: WorkspaceSession }> }) {
	const { t } = useTranslation();
	const max = Math.max(...rows.map((row) => row.usage.totalTokens), 1);
	return (
		<div className="rounded-xl border border-(--color-border-settings-input) bg-(--color-bg-settings-input) p-4">
			<h3 className="text-xs font-semibold text-settings-label">{t("settings.usage.bySession")}</h3>
			{rows.length === 0 ? <p className="mt-3 text-xs text-settings-muted">{t("settings.usage.empty")}</p> : (
				<div className="mt-2 divide-y divide-(--color-border-settings-input)">{rows.map(({ usage, session }) => (
					<div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-3 py-2.5" key={usage.sessionId}>
						<div className="min-w-0"><div className="flex items-center gap-1.5"><p className="truncate text-xs text-settings-label">{session?.title ?? usage.sessionId}</p>{usage.incomplete ? <AlertTriangle aria-label={t("settings.usage.incomplete")} className="size-3 shrink-0 text-amber-500" /> : null}</div><p className="mt-0.5 truncate text-2xs text-settings-muted">{session ? `${session.workspaceName} · ${formatHarnessName(session.provider)}` : t("settings.usage.unknownSession")}</p><div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-sky-500" style={{ width: `${(usage.totalTokens / max) * 100}%` }} /></div></div>
						<span className="self-center text-right font-mono text-xs text-settings-label">{localizedTokenCount(usage.totalTokens, t("settings.usage.tokenUnit"))}</span>
					</div>
				))}</div>
			)}
		</div>
	);
}

function LegendDot({ className, label, value }: { className: string; label: string; value: number }) {
	const { t } = useTranslation();
	return <span className="inline-flex items-center gap-1.5"><span className={cn("size-2 rounded-full", className)} />{label} <span className="font-mono text-settings-label">{localizedTokenCount(value, t("settings.usage.tokenUnit"))}</span></span>;
}

function localizedTokenCount(value: number, unit: string): string {
	return formatTokenCount(value).replace(/ tok$/, ` ${unit}`);
}

function UsageStateCard({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "error" }) {
	return <div className={cn("flex items-center gap-2 rounded-lg border border-(--color-border-settings-input) bg-(--color-bg-settings-input) p-4 text-xs text-settings-muted", tone === "error" && "border-destructive/30 text-destructive")} role={tone === "error" ? "alert" : undefined}>{children}</div>;
}

function tokenTotal(totals: UsageOverview["totals"]): number { return (totals.inputTokens ?? 0) + (totals.outputTokens ?? 0); }
function formatLargeTokenCount(value: number): string { return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}K` : value.toLocaleString("en-US"); }
function formatHarnessName(value: string): string { const names: Record<string, string> = { codex: "Codex", "claude-code": "Claude Code", claude: "Claude" }; return names[value] ?? value.split(/[-_]/).map((part) => part ? part[0]!.toUpperCase() + part.slice(1) : "").join(" "); }

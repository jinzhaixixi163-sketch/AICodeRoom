import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appI18n } from "../../i18n";
import { UsageSection } from "./UsageSection";

const { overviewQueryMock, summariesQueryMock, workspaceQueryMock } = vi.hoisted(() => ({
	overviewQueryMock: vi.fn(),
	summariesQueryMock: vi.fn(),
	workspaceQueryMock: vi.fn(),
}));

vi.mock("../../hooks/useUsageOverview", () => ({ useUsageOverview: overviewQueryMock }));
vi.mock("../../hooks/useSessionUsageSummaries", () => ({ useSessionUsageSummaries: summariesQueryMock }));
vi.mock("../../hooks/useWorkspaceQuery", () => ({ useWorkspaceQuery: workspaceQueryMock }));

describe("UsageSection", () => {
	beforeEach(async () => {
		await appI18n.changeLanguage("en");
		overviewQueryMock.mockReturnValue({
			data: {
				sessionCount: 2,
				incompleteSessionCount: 1,
				totals: {
					inputTokens: 10_000,
					uncachedInputTokens: 7_000,
					cacheReadTokens: 3_000,
					cacheWriteTokens: 0,
					outputTokens: 2_000,
					reasoningTokens: 500,
				},
				harnesses: [
					{
						harness: "codex",
						totals: { inputTokens: 8_000, outputTokens: 1_500 },
						models: [{ modelId: "gpt-5.6", totals: { inputTokens: 8_000, outputTokens: 1_500 } }],
					},
					{
						harness: "claude-code",
						totals: { inputTokens: 2_000, outputTokens: 500 },
						models: [{ modelId: "claude-sonnet", totals: { inputTokens: 2_000, outputTokens: 500 } }],
					},
				],
			},
			isLoading: false,
			isError: false,
			isFetching: false,
			refetch: vi.fn(),
		});
		summariesQueryMock.mockReturnValue({
			data: new Map([
				["s1", { sessionId: "s1", totalTokens: 9_500, incomplete: false }],
				["s2", { sessionId: "s2", totalTokens: 2_500, incomplete: true }],
			]),
			isLoading: false,
			isError: false,
			isFetching: false,
			refetch: vi.fn(),
		});
		workspaceQueryMock.mockReturnValue({
			data: [{
				id: "p1",
				name: "AICodeRoom",
				sessions: [
					{ id: "s1", title: "Build usage dashboard", workspaceName: "AICodeRoom", provider: "codex" },
					{ id: "s2", title: "Review tokens", workspaceName: "AICodeRoom", provider: "claude-code" },
				],
			}],
			refetch: vi.fn(),
		});
	});

	it("renders real aggregate, provider, and session usage", () => {
		render(<UsageSection />);
		expect(screen.getByTestId("usage-overview")).toBeInTheDocument();
		expect(screen.getByLabelText("12,000 total tokens")).toBeInTheDocument();
		expect(screen.getByText("Codex")).toBeInTheDocument();
		expect(screen.getByText("Claude Code")).toBeInTheDocument();
		expect(screen.getByText("Build usage dashboard")).toBeInTheDocument();
		expect(screen.getByLabelText("Usage may be incomplete")).toBeInTheDocument();
	});
});

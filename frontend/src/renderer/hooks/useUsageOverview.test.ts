import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api-client", () => ({
	apiClient: { GET: (...args: unknown[]) => getMock(...args) },
}));

import { fetchUsageOverview, usageOverviewQueryKey } from "./useUsageOverview";

describe("usage overview", () => {
	beforeEach(() => {
		getMock.mockReset().mockResolvedValue({
			data: {
				sessionCount: 0,
				incompleteSessionCount: 0,
				totals: {},
				harnesses: [],
			},
		});
	});

	it("fetches the aggregate usage endpoint with an optional project", async () => {
		await fetchUsageOverview("reverb");
		expect(getMock).toHaveBeenCalledWith("/api/v1/usage/overview", {
			params: { query: { projectId: "reverb" } },
		});
		expect(usageOverviewQueryKey()).toEqual(["session-usage", "overview", "all"]);
	});
});

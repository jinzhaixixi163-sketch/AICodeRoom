import { useQuery } from "@tanstack/react-query";
import type { components } from "../../api/schema";
import { apiClient } from "../lib/api-client";
import { sessionUsageQueryRoot } from "./useSessionUsageSummaries";

export type UsageOverview = components["schemas"]["UsageOverviewResponse"];

export const usageOverviewQueryKey = (projectId?: string) =>
	[...sessionUsageQueryRoot, "overview", projectId ?? "all"] as const;

export async function fetchUsageOverview(projectId?: string): Promise<UsageOverview> {
	const { data, error } = await apiClient.GET("/api/v1/usage/overview", {
		params: { query: projectId ? { projectId } : {} },
	});
	if (error) throw error;
	return data;
}

export function useUsageOverview(projectId?: string) {
	return useQuery({
		queryKey: usageOverviewQueryKey(projectId),
		queryFn: () => fetchUsageOverview(projectId),
		retry: 1,
	});
}

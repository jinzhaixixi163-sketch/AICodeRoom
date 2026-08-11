import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { components } from "../../api/schema";
import { apiClient, apiErrorMessage } from "../lib/api-client";

export type AIAccount = components["schemas"]["AiaccountProfile"];
export type AIAccountHarness = "codex" | "claude-code";

export const aiAccountsQueryKey = ["ai-accounts"] as const;

export function useAIAccounts() {
	return useQuery({
		queryKey: aiAccountsQueryKey,
		queryFn: async (): Promise<AIAccount[]> => {
			const { data, error } = await apiClient.GET("/api/v1/ai-accounts");
			if (error) throw new Error(apiErrorMessage(error));
			return data?.accounts ?? [];
		},
		refetchInterval: (query) =>
			query.state.data?.some((account) => account.authStatus === "authenticating") ? 2_000 : false,
	});
}

export function useCreateAIAccount() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ harness, label }: { harness: AIAccountHarness; label: string }) => {
			const { data, error } = await apiClient.POST("/api/v1/ai-accounts", { body: { harness, label } });
			if (error) throw new Error(apiErrorMessage(error));
			return data?.account;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: aiAccountsQueryKey }),
	});
}

export function useLoginAIAccount() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await apiClient.POST("/api/v1/ai-accounts/{id}/login", {
				params: { path: { id } },
			});
			if (error) throw new Error(apiErrorMessage(error));
			return data?.account;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: aiAccountsQueryKey }),
	});
}

export function useSetAIAccountCredential() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, token }: { id: string; token: string }) => {
			const { data, error } = await apiClient.PUT("/api/v1/ai-accounts/{id}/credential", {
				params: { path: { id } },
				body: { token },
			});
			if (error) throw new Error(apiErrorMessage(error));
			return data?.account;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: aiAccountsQueryKey }),
	});
}

export function useClearAIAccountCredential() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await apiClient.DELETE("/api/v1/ai-accounts/{id}/credential", {
				params: { path: { id } },
			});
			if (error) throw new Error(apiErrorMessage(error));
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: aiAccountsQueryKey }),
	});
}

export function useSetAIAccountEnabled() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
			const { data, error } = await apiClient.PATCH("/api/v1/ai-accounts/{id}", {
				params: { path: { id } },
				body: { enabled },
			});
			if (error) throw new Error(apiErrorMessage(error));
			return data?.account;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: aiAccountsQueryKey }),
	});
}

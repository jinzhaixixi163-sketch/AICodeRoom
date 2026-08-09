package controllers

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
	"github.com/aoagents/agent-orchestrator/backend/internal/httpd/apispec"
	"github.com/aoagents/agent-orchestrator/backend/internal/httpd/envelope"
)

// UsageSummaryService is the controller-facing compact usage read contract.
type UsageSummaryService interface {
	ListCompact(context.Context, domain.ProjectID) ([]domain.CompactSessionUsage, error)
	Overview(context.Context, domain.ProjectID) (domain.UsageOverview, error)
	Get(context.Context, domain.SessionID) (domain.SessionUsageSummary, error)
}

// UsageController owns compact dashboard usage routes.
type UsageController struct {
	Svc UsageSummaryService
}

// Register mounts usage routes on the supplied router.
func (c *UsageController) Register(r chi.Router) {
	r.Get("/usage/overview", c.overview)
	r.Get("/usage/sessions", c.listSessions)
	r.Get("/usage/sessions/{sessionId}", c.getSession)
}

func (c *UsageController) overview(w http.ResponseWriter, r *http.Request) {
	if c.Svc == nil {
		apispec.NotImplemented(w, r, "GET", "/api/v1/usage/overview")
		return
	}
	summary, err := c.Svc.Overview(r.Context(), domain.ProjectID(r.URL.Query().Get("projectId")))
	if err != nil {
		envelope.WriteError(w, r, err)
		return
	}
	envelope.WriteJSON(w, http.StatusOK, usageOverviewResponse(summary))
}

func (c *UsageController) listSessions(w http.ResponseWriter, r *http.Request) {
	if c.Svc == nil {
		apispec.NotImplemented(w, r, "GET", "/api/v1/usage/sessions")
		return
	}
	items, err := c.Svc.ListCompact(r.Context(), domain.ProjectID(r.URL.Query().Get("projectId")))
	if err != nil {
		envelope.WriteError(w, r, err)
		return
	}
	out := make([]CompactSessionUsageResponse, 0, len(items))
	for _, item := range items {
		out = append(out, CompactSessionUsageResponse{
			SessionID: item.SessionID, TotalTokens: item.TotalTokens, Incomplete: item.Incomplete,
		})
	}
	envelope.WriteJSON(w, http.StatusOK, ListCompactSessionUsageResponse{Sessions: out})
}

func (c *UsageController) getSession(w http.ResponseWriter, r *http.Request) {
	if c.Svc == nil {
		apispec.NotImplemented(w, r, "GET", "/api/v1/usage/sessions/{sessionId}")
		return
	}
	summary, err := c.Svc.Get(r.Context(), domain.SessionID(chi.URLParam(r, "sessionId")))
	if err != nil {
		envelope.WriteError(w, r, err)
		return
	}
	envelope.WriteJSON(w, http.StatusOK, sessionUsageResponse(summary))
}

func sessionUsageResponse(summary domain.SessionUsageSummary) SessionUsageResponse {
	return SessionUsageResponse{
		SessionID: summary.SessionID, Incomplete: summary.Incomplete,
		Totals: usageTotalsResponse(summary.Totals), Harnesses: usageHarnessesResponse(summary.Harnesses),
	}
}

func usageOverviewResponse(summary domain.UsageOverview) UsageOverviewResponse {
	return UsageOverviewResponse{
		SessionCount: summary.SessionCount, IncompleteSessionCount: summary.IncompleteSessionCount,
		Totals: usageTotalsResponse(summary.Totals), Harnesses: usageHarnessesResponse(summary.Harnesses),
	}
}

func usageHarnessesResponse(summaries []domain.HarnessUsageSummary) []UsageHarnessResponse {
	harnesses := make([]UsageHarnessResponse, 0, len(summaries))
	for _, harness := range summaries {
		models := make([]UsageModelResponse, 0, len(harness.Models))
		for _, model := range harness.Models {
			models = append(models, UsageModelResponse{
				ModelID: model.ModelID, Totals: usageTotalsResponse(model.Totals),
			})
		}
		harnesses = append(harnesses, UsageHarnessResponse{
			Harness: string(harness.Harness), Totals: usageTotalsResponse(harness.Totals), Models: models,
		})
	}
	return harnesses
}

func usageTotalsResponse(totals domain.UsageMetricTotals) UsageTotalsResponse {
	return UsageTotalsResponse{
		InputTokens: totals.InputTokens, UncachedInputTokens: totals.UncachedInputTokens,
		CacheReadTokens: totals.CacheReadTokens, CacheWriteTokens: totals.CacheWriteTokens,
		OutputTokens: totals.OutputTokens, ReasoningTokens: totals.ReasoningTokens,
	}
}

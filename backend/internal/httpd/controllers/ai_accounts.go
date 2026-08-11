package controllers

import (
	"context"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
	"github.com/aoagents/agent-orchestrator/backend/internal/httpd/apispec"
	"github.com/aoagents/agent-orchestrator/backend/internal/httpd/envelope"
	aiaccountsvc "github.com/aoagents/agent-orchestrator/backend/internal/service/aiaccount"
)

type AIAccountService interface {
	List(ctx context.Context) ([]aiaccountsvc.Profile, error)
	Create(ctx context.Context, in aiaccountsvc.CreateInput) (aiaccountsvc.Profile, error)
	Update(ctx context.Context, id domain.AccountProfileID, in aiaccountsvc.UpdateInput) (aiaccountsvc.Profile, error)
	Delete(ctx context.Context, id domain.AccountProfileID) error
	StartLogin(ctx context.Context, id domain.AccountProfileID) (aiaccountsvc.Profile, error)
	SetCredential(ctx context.Context, id domain.AccountProfileID, secret string) (aiaccountsvc.Profile, error)
	ClearCredential(ctx context.Context, id domain.AccountProfileID) error
}

type AIAccountsController struct {
	Svc AIAccountService
}

func (c *AIAccountsController) Register(r chi.Router) {
	r.Get("/ai-accounts", c.list)
	r.Post("/ai-accounts", c.create)
	r.Patch("/ai-accounts/{id}", c.update)
	r.Delete("/ai-accounts/{id}", c.delete)
	r.Post("/ai-accounts/{id}/login", c.login)
	r.Put("/ai-accounts/{id}/credential", c.setCredential)
	r.Delete("/ai-accounts/{id}/credential", c.clearCredential)
}

func (c *AIAccountsController) list(w http.ResponseWriter, r *http.Request) {
	if c.Svc == nil {
		apispec.NotImplemented(w, r, http.MethodGet, "/api/v1/ai-accounts")
		return
	}
	profiles, err := c.Svc.List(r.Context())
	if err != nil {
		envelope.WriteError(w, r, err)
		return
	}
	envelope.WriteJSON(w, http.StatusOK, ListAIAccountsResponse{Accounts: profiles})
}

func (c *AIAccountsController) create(w http.ResponseWriter, r *http.Request) {
	if c.Svc == nil {
		apispec.NotImplemented(w, r, http.MethodPost, "/api/v1/ai-accounts")
		return
	}
	var req CreateAIAccountRequest
	if err := decodeJSON(r, &req); err != nil {
		envelope.WriteAPIError(w, r, http.StatusBadRequest, "bad_request", "INVALID_JSON", "Invalid JSON body", nil)
		return
	}
	profile, err := c.Svc.Create(r.Context(), aiaccountsvc.CreateInput{
		Harness: req.Harness,
		Label:   strings.TrimSpace(req.Label),
	})
	if err != nil {
		envelope.WriteError(w, r, err)
		return
	}
	envelope.WriteJSON(w, http.StatusCreated, AIAccountResponse{Account: profile})
}

func (c *AIAccountsController) update(w http.ResponseWriter, r *http.Request) {
	if c.Svc == nil {
		apispec.NotImplemented(w, r, http.MethodPatch, "/api/v1/ai-accounts/{id}")
		return
	}
	var req UpdateAIAccountRequest
	if err := decodeJSON(r, &req); err != nil {
		envelope.WriteAPIError(w, r, http.StatusBadRequest, "bad_request", "INVALID_JSON", "Invalid JSON body", nil)
		return
	}
	profile, err := c.Svc.Update(r.Context(), domain.AccountProfileID(chi.URLParam(r, "id")), aiaccountsvc.UpdateInput{
		Label: req.Label, Enabled: req.Enabled,
	})
	if err != nil {
		envelope.WriteError(w, r, err)
		return
	}
	envelope.WriteJSON(w, http.StatusOK, AIAccountResponse{Account: profile})
}

func (c *AIAccountsController) delete(w http.ResponseWriter, r *http.Request) {
	if c.Svc == nil {
		apispec.NotImplemented(w, r, http.MethodDelete, "/api/v1/ai-accounts/{id}")
		return
	}
	if err := c.Svc.Delete(r.Context(), domain.AccountProfileID(chi.URLParam(r, "id"))); err != nil {
		envelope.WriteError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (c *AIAccountsController) login(w http.ResponseWriter, r *http.Request) {
	if c.Svc == nil {
		apispec.NotImplemented(w, r, http.MethodPost, "/api/v1/ai-accounts/{id}/login")
		return
	}
	profile, err := c.Svc.StartLogin(r.Context(), domain.AccountProfileID(chi.URLParam(r, "id")))
	if err != nil {
		envelope.WriteError(w, r, err)
		return
	}
	envelope.WriteJSON(w, http.StatusAccepted, AIAccountResponse{Account: profile})
}

func (c *AIAccountsController) setCredential(w http.ResponseWriter, r *http.Request) {
	if c.Svc == nil {
		apispec.NotImplemented(w, r, http.MethodPut, "/api/v1/ai-accounts/{id}/credential")
		return
	}
	var req SetAIAccountCredentialRequest
	if err := decodeJSON(r, &req); err != nil {
		envelope.WriteAPIError(w, r, http.StatusBadRequest, "bad_request", "INVALID_JSON", "Invalid JSON body", nil)
		return
	}
	profile, err := c.Svc.SetCredential(r.Context(), domain.AccountProfileID(chi.URLParam(r, "id")), req.Token)
	if err != nil {
		envelope.WriteError(w, r, err)
		return
	}
	envelope.WriteJSON(w, http.StatusOK, AIAccountResponse{Account: profile})
}

func (c *AIAccountsController) clearCredential(w http.ResponseWriter, r *http.Request) {
	if c.Svc == nil {
		apispec.NotImplemented(w, r, http.MethodDelete, "/api/v1/ai-accounts/{id}/credential")
		return
	}
	if err := c.Svc.ClearCredential(r.Context(), domain.AccountProfileID(chi.URLParam(r, "id"))); err != nil {
		envelope.WriteError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type AIAccountIDParam struct {
	ID string `path:"id" description:"AI account profile id."`
}

type CreateAIAccountRequest struct {
	Harness domain.AgentHarness `json:"harness" enum:"codex,claude-code"`
	Label   string              `json:"label,omitempty" maxLength:"40"`
}

type UpdateAIAccountRequest struct {
	Label   *string `json:"label,omitempty" maxLength:"40"`
	Enabled *bool   `json:"enabled,omitempty"`
}

type SetAIAccountCredentialRequest struct {
	Token string `json:"token" minLength:"1" maxLength:"3000"`
}

type AIAccountResponse struct {
	Account aiaccountsvc.Profile `json:"account"`
}

type ListAIAccountsResponse struct {
	Accounts []aiaccountsvc.Profile `json:"accounts"`
}

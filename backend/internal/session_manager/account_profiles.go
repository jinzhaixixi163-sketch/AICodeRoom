package sessionmanager

import (
	"context"
	"fmt"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
)

// AccountProfileResolver is the consumer-owned boundary between session launch
// and AICodeRoom's account catalog.
type AccountProfileResolver interface {
	ResolveEnvironment(ctx context.Context, id domain.AccountProfileID, harness domain.AgentHarness) (map[string]string, error)
}

func (m *Manager) resolveAccountProfile(ctx context.Context, id domain.AccountProfileID, harness domain.AgentHarness) (map[string]string, error) {
	if id == "" {
		return nil, nil
	}
	if m.accounts == nil {
		return nil, fmt.Errorf("account profiles are unavailable")
	}
	return m.accounts.ResolveEnvironment(ctx, id, harness)
}

func applyEnvOverrides(target, overrides map[string]string) {
	for key, value := range overrides {
		target[key] = value
	}
}

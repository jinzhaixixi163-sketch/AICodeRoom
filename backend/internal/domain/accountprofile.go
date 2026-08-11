package domain

import "time"

// AccountProfileID identifies one isolated provider login.
type AccountProfileID string

// AIAccountProfile is non-secret metadata for a Codex or Claude Code login.
// The provider remains the credential owner; ConfigDir only selects which
// provider-owned credential store a launched process uses.
type AIAccountProfile struct {
	ID        AccountProfileID `json:"id"`
	Harness   AgentHarness     `json:"harness"`
	Label     string           `json:"label"`
	ConfigDir string           `json:"-"`
	Enabled   bool             `json:"enabled"`
	CreatedAt time.Time        `json:"createdAt"`
	UpdatedAt time.Time        `json:"updatedAt"`
}

// SupportsAccountProfiles reports whether AICodeRoom knows how to isolate this
// harness's authentication state.
func SupportsAccountProfiles(harness AgentHarness) bool {
	return harness == HarnessCodex || harness == HarnessClaudeCode
}

// Package aiaccount owns AICodeRoom's catalog of isolated provider logins.
// It stores metadata only; provider CLIs and the OS remain credential owners.
package aiaccount

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
	"github.com/aoagents/agent-orchestrator/backend/internal/httpd/apierr"
)

const (
	maxLabelRunes = 40
	statusTimeout = 5 * time.Second
)

type AuthStatus string

const (
	AuthAuthenticated  AuthStatus = "authenticated"
	AuthSignedOut      AuthStatus = "signed_out"
	AuthUnavailable    AuthStatus = "unavailable"
	AuthAuthenticating AuthStatus = "authenticating"
)

type Profile struct {
	ID                   domain.AccountProfileID `json:"id"`
	Harness              domain.AgentHarness     `json:"harness"`
	Label                string                  `json:"label"`
	Enabled              bool                    `json:"enabled"`
	AuthStatus           AuthStatus              `json:"authStatus" enum:"authenticated,signed_out,unavailable,authenticating"`
	AuthMethod           string                  `json:"authMethod,omitempty"`
	CredentialConfigured bool                    `json:"credentialConfigured"`
	CreatedAt            time.Time               `json:"createdAt"`
	UpdatedAt            time.Time               `json:"updatedAt"`
}

type CreateInput struct {
	Harness domain.AgentHarness
	Label   string
}

type UpdateInput struct {
	Label   *string
	Enabled *bool
}

type Store interface {
	ListAIAccountProfiles(ctx context.Context) ([]domain.AIAccountProfile, error)
	GetAIAccountProfile(ctx context.Context, id domain.AccountProfileID) (domain.AIAccountProfile, bool, error)
	InsertAIAccountProfile(ctx context.Context, profile domain.AIAccountProfile) error
	SetAIAccountProfileEnabled(ctx context.Context, id domain.AccountProfileID, enabled bool, now time.Time) (bool, error)
	RenameAIAccountProfile(ctx context.Context, id domain.AccountProfileID, label string, now time.Time) (bool, error)
	DeleteAIAccountProfile(ctx context.Context, id domain.AccountProfileID) (bool, error)
}

type Service struct {
	store         Store
	root          string
	now           func() time.Time
	lookPath      func(string) (string, error)
	resolveBinary func(context.Context, domain.AgentHarness) (string, error)
	vault         CredentialVault

	mu        sync.Mutex
	loggingIn map[domain.AccountProfileID]struct{}
}

type Option func(*Service)

func WithBinaryResolver(resolver func(context.Context, domain.AgentHarness) (string, error)) Option {
	return func(s *Service) { s.resolveBinary = resolver }
}

func WithCredentialVault(vault CredentialVault) Option {
	return func(s *Service) { s.vault = vault }
}

func New(store Store, dataDir string, options ...Option) *Service {
	s := &Service{
		store:     store,
		root:      filepath.Join(dataDir, "accounts"),
		now:       func() time.Time { return time.Now().UTC() },
		lookPath:  exec.LookPath,
		vault:     systemCredentialVault{},
		loggingIn: make(map[domain.AccountProfileID]struct{}),
	}
	for _, option := range options {
		option(s)
	}
	return s
}

func (s *Service) List(ctx context.Context) ([]Profile, error) {
	rows, err := s.store.ListAIAccountProfiles(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]Profile, 0, len(rows))
	for _, row := range rows {
		out = append(out, s.view(ctx, row))
	}
	return out, nil
}

func (s *Service) Create(ctx context.Context, in CreateInput) (Profile, error) {
	if !domain.SupportsAccountProfiles(in.Harness) {
		return Profile{}, apierr.Invalid("AI_ACCOUNT_HARNESS_UNSUPPORTED", "Only Codex and Claude Code accounts can be isolated", nil)
	}
	label := strings.TrimSpace(in.Label)
	if label == "" {
		if in.Harness == domain.HarnessCodex {
			label = "GPT account"
		} else {
			label = "Claude account"
		}
	}
	if len([]rune(label)) > maxLabelRunes {
		return Profile{}, apierr.Invalid("AI_ACCOUNT_LABEL_TOO_LONG", "Account label must be 40 characters or fewer", nil)
	}
	id := domain.AccountProfileID(uuid.NewString())
	configDir := filepath.Join(s.root, string(id))
	if err := ensurePrivateDirectory(configDir); err != nil {
		return Profile{}, err
	}
	now := s.now()
	profile := domain.AIAccountProfile{
		ID: id, Harness: in.Harness, Label: label, ConfigDir: configDir,
		Enabled: true, CreatedAt: now, UpdatedAt: now,
	}
	if err := s.store.InsertAIAccountProfile(ctx, profile); err != nil {
		return Profile{}, err
	}
	return s.view(ctx, profile), nil
}

func (s *Service) Update(ctx context.Context, id domain.AccountProfileID, in UpdateInput) (Profile, error) {
	profile, ok, err := s.store.GetAIAccountProfile(ctx, id)
	if err != nil {
		return Profile{}, err
	}
	if !ok {
		return Profile{}, apierr.NotFound("AI_ACCOUNT_NOT_FOUND", "AI account profile not found")
	}
	if in.Label != nil {
		label := strings.TrimSpace(*in.Label)
		if label == "" || len([]rune(label)) > maxLabelRunes {
			return Profile{}, apierr.Invalid("AI_ACCOUNT_LABEL_INVALID", "Account label must be between 1 and 40 characters", nil)
		}
		if _, err := s.store.RenameAIAccountProfile(ctx, id, label, s.now()); err != nil {
			return Profile{}, err
		}
	}
	if in.Enabled != nil {
		if _, err := s.store.SetAIAccountProfileEnabled(ctx, id, *in.Enabled, s.now()); err != nil {
			return Profile{}, err
		}
	}
	profile, _, err = s.store.GetAIAccountProfile(ctx, id)
	if err != nil {
		return Profile{}, err
	}
	return s.view(ctx, profile), nil
}

// Delete removes the catalog entry but deliberately preserves the provider
// config directory. This makes the action recoverable and avoids deleting
// credentials or session history behind the user's back.
func (s *Service) Delete(ctx context.Context, id domain.AccountProfileID) error {
	deleted, err := s.store.DeleteAIAccountProfile(ctx, id)
	if err != nil {
		return err
	}
	if !deleted {
		return apierr.NotFound("AI_ACCOUNT_NOT_FOUND", "AI account profile not found")
	}
	return nil
}

// ResolveEnvironment implements sessionmanager.AccountProfileResolver.
func (s *Service) ResolveEnvironment(ctx context.Context, id domain.AccountProfileID, harness domain.AgentHarness) (map[string]string, error) {
	profile, ok, err := s.store.GetAIAccountProfile(ctx, id)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, apierr.NotFound("AI_ACCOUNT_NOT_FOUND", "Selected AI account profile no longer exists")
	}
	if !profile.Enabled {
		return nil, apierr.Conflict("AI_ACCOUNT_DISABLED", "Selected AI account profile is disabled", nil)
	}
	if profile.Harness != harness {
		return nil, apierr.Invalid("AI_ACCOUNT_HARNESS_MISMATCH", "Selected AI account does not match the task agent", nil)
	}
	return s.environment(profile)
}

// SetCredential stores a Claude subscription token in the OS credential vault.
// It is never written to SQLite, profile files, logs, or command arguments.
func (s *Service) SetCredential(ctx context.Context, id domain.AccountProfileID, secret string) (Profile, error) {
	profile, ok, err := s.store.GetAIAccountProfile(ctx, id)
	if err != nil {
		return Profile{}, err
	}
	if !ok {
		return Profile{}, apierr.NotFound("AI_ACCOUNT_NOT_FOUND", "AI account profile not found")
	}
	if profile.Harness != domain.HarnessClaudeCode {
		return Profile{}, apierr.Invalid("AI_ACCOUNT_CREDENTIAL_UNSUPPORTED", "Codex credentials are created by the official browser login", nil)
	}
	secret = strings.TrimSpace(secret)
	if secret == "" || len(secret) > 3000 {
		return Profile{}, apierr.Invalid("AI_ACCOUNT_CREDENTIAL_INVALID", "Claude token must be between 1 and 3000 characters", nil)
	}
	if err := s.vault.Set(id, secret); err != nil {
		return Profile{}, fmt.Errorf("store isolated Claude credential: %w", err)
	}
	return s.view(ctx, profile), nil
}

// ClearCredential removes only the selected profile's login credential. The
// profile configuration and task history remain recoverable.
func (s *Service) ClearCredential(ctx context.Context, id domain.AccountProfileID) error {
	profile, ok, err := s.store.GetAIAccountProfile(ctx, id)
	if err != nil {
		return err
	}
	if !ok {
		return apierr.NotFound("AI_ACCOUNT_NOT_FOUND", "AI account profile not found")
	}
	if profile.Harness == domain.HarnessClaudeCode {
		if err := s.vault.Delete(id); err != nil && !errorsIsCredentialNotFound(err) {
			return fmt.Errorf("delete isolated Claude credential: %w", err)
		}
		return nil
	}
	if err := os.Remove(filepath.Join(profile.ConfigDir, "auth.json")); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("delete isolated Codex credential: %w", err)
	}
	return nil
}

// StartLogin launches the provider's own OAuth flow in the profile's isolated
// environment. AICodeRoom never receives the password or OAuth token.
func (s *Service) StartLogin(ctx context.Context, id domain.AccountProfileID) (Profile, error) {
	profile, ok, err := s.store.GetAIAccountProfile(ctx, id)
	if err != nil {
		return Profile{}, err
	}
	if !ok {
		return Profile{}, apierr.NotFound("AI_ACCOUNT_NOT_FOUND", "AI account profile not found")
	}
	if profile.Harness == domain.HarnessClaudeCode {
		return Profile{}, apierr.Conflict("AI_ACCOUNT_ISOLATED_TOKEN_REQUIRED", "Claude on macOS requires a profile-specific subscription token", nil)
	}
	_, args := loginCommand(profile.Harness)
	path, err := s.binaryPath(ctx, profile.Harness)
	if err != nil {
		return Profile{}, apierr.Conflict("AI_ACCOUNT_BINARY_MISSING", "The provider CLI is not installed", nil)
	}
	env, err := s.loginEnvironment(profile)
	if err != nil {
		return Profile{}, err
	}

	s.mu.Lock()
	if _, running := s.loggingIn[id]; running {
		s.mu.Unlock()
		return s.view(ctx, profile), nil
	}
	s.loggingIn[id] = struct{}{}
	s.mu.Unlock()

	cmd := exec.Command(path, args...)
	cmd.Env = mergedEnvironment(env)
	cmd.Dir = profile.ConfigDir
	if err := cmd.Start(); err != nil {
		s.finishLogin(id)
		return Profile{}, fmt.Errorf("start provider login: %w", err)
	}
	go func() {
		_ = cmd.Wait()
		s.finishLogin(id)
	}()
	return Profile{
		ID: profile.ID, Harness: profile.Harness, Label: profile.Label, Enabled: profile.Enabled,
		AuthStatus: AuthAuthenticating, CreatedAt: profile.CreatedAt, UpdatedAt: profile.UpdatedAt,
	}, nil
}

func (s *Service) finishLogin(id domain.AccountProfileID) {
	s.mu.Lock()
	delete(s.loggingIn, id)
	s.mu.Unlock()
}

func (s *Service) view(ctx context.Context, row domain.AIAccountProfile) Profile {
	status, method := s.authStatus(ctx, row)
	configured := status == AuthAuthenticated
	if row.Harness == domain.HarnessClaudeCode {
		_, configuredErr := s.vault.Get(row.ID)
		configured = configuredErr == nil
	}
	return Profile{
		ID: row.ID, Harness: row.Harness, Label: row.Label, Enabled: row.Enabled,
		AuthStatus: status, AuthMethod: method, CredentialConfigured: configured,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}
}

func (s *Service) authStatus(ctx context.Context, profile domain.AIAccountProfile) (AuthStatus, string) {
	s.mu.Lock()
	_, running := s.loggingIn[profile.ID]
	s.mu.Unlock()
	if running {
		return AuthAuthenticating, ""
	}
	_, args := statusCommand(profile.Harness)
	path, err := s.binaryPath(ctx, profile.Harness)
	if err != nil {
		return AuthUnavailable, ""
	}
	env, envErr := s.environment(profile)
	if envErr != nil {
		return AuthUnavailable, ""
	}
	if profile.Harness == domain.HarnessClaudeCode && env["CLAUDE_CODE_OAUTH_TOKEN"] == "" {
		return AuthSignedOut, ""
	}
	statusCtx, cancel := context.WithTimeout(ctx, statusTimeout)
	defer cancel()
	cmd := exec.CommandContext(statusCtx, path, args...)
	cmd.Env = mergedEnvironment(env)
	output, err := cmd.Output()
	if profile.Harness == domain.HarnessClaudeCode {
		var payload struct {
			LoggedIn   bool   `json:"loggedIn"`
			AuthMethod string `json:"authMethod"`
		}
		if json.Unmarshal(output, &payload) == nil && payload.LoggedIn {
			return AuthAuthenticated, payload.AuthMethod
		}
		if err == nil || len(output) > 0 {
			return AuthSignedOut, ""
		}
		return AuthUnavailable, ""
	}
	if err == nil && strings.Contains(strings.ToLower(string(output)), "logged in") {
		return AuthAuthenticated, "chatgpt"
	}
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		return AuthSignedOut, ""
	}
	return AuthUnavailable, ""
}

func mergedEnvironment(overrides map[string]string) []string {
	merged := make(map[string]string)
	for _, entry := range os.Environ() {
		if key, value, ok := strings.Cut(entry, "="); ok {
			merged[key] = value
		}
	}
	for key, value := range overrides {
		if value == "" {
			delete(merged, key)
		} else {
			merged[key] = value
		}
	}
	env := make([]string, 0, len(merged))
	for key, value := range merged {
		env = append(env, key+"="+value)
	}
	return env
}

func (s *Service) binaryPath(ctx context.Context, harness domain.AgentHarness) (string, error) {
	if s.resolveBinary != nil {
		return s.resolveBinary(ctx, harness)
	}
	binary, _ := loginCommand(harness)
	return s.lookPath(binary)
}

func loginCommand(harness domain.AgentHarness) (string, []string) {
	if harness == domain.HarnessCodex {
		return "codex", []string{"login"}
	}
	return "claude", []string{"auth", "login", "--claudeai"}
}

func statusCommand(harness domain.AgentHarness) (string, []string) {
	if harness == domain.HarnessCodex {
		return "codex", []string{"login", "status"}
	}
	return "claude", []string{"auth", "status"}
}

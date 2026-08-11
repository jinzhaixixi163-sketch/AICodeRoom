package aiaccount

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
)

type memoryVault struct {
	secrets map[domain.AccountProfileID]string
}

func newMemoryVault() *memoryVault {
	return &memoryVault{secrets: make(map[domain.AccountProfileID]string)}
}

func (v *memoryVault) Get(id domain.AccountProfileID) (string, error) {
	secret, ok := v.secrets[id]
	if !ok {
		return "", errCredentialNotFound
	}
	return secret, nil
}

func (v *memoryVault) Set(id domain.AccountProfileID, secret string) error {
	v.secrets[id] = secret
	return nil
}

func (v *memoryVault) Delete(id domain.AccountProfileID) error {
	if _, ok := v.secrets[id]; !ok {
		return errCredentialNotFound
	}
	delete(v.secrets, id)
	return nil
}

type memoryStore struct {
	profiles map[domain.AccountProfileID]domain.AIAccountProfile
}

func newMemoryStore() *memoryStore {
	return &memoryStore{profiles: make(map[domain.AccountProfileID]domain.AIAccountProfile)}
}

func (s *memoryStore) ListAIAccountProfiles(context.Context) ([]domain.AIAccountProfile, error) {
	out := make([]domain.AIAccountProfile, 0, len(s.profiles))
	for _, profile := range s.profiles {
		out = append(out, profile)
	}
	return out, nil
}

func (s *memoryStore) GetAIAccountProfile(_ context.Context, id domain.AccountProfileID) (domain.AIAccountProfile, bool, error) {
	profile, ok := s.profiles[id]
	return profile, ok, nil
}

func (s *memoryStore) InsertAIAccountProfile(_ context.Context, profile domain.AIAccountProfile) error {
	s.profiles[profile.ID] = profile
	return nil
}

func (s *memoryStore) SetAIAccountProfileEnabled(_ context.Context, id domain.AccountProfileID, enabled bool, now time.Time) (bool, error) {
	profile, ok := s.profiles[id]
	if !ok {
		return false, nil
	}
	profile.Enabled, profile.UpdatedAt = enabled, now
	s.profiles[id] = profile
	return true, nil
}

func (s *memoryStore) RenameAIAccountProfile(_ context.Context, id domain.AccountProfileID, label string, now time.Time) (bool, error) {
	profile, ok := s.profiles[id]
	if !ok {
		return false, nil
	}
	profile.Label, profile.UpdatedAt = label, now
	s.profiles[id] = profile
	return true, nil
}

func (s *memoryStore) DeleteAIAccountProfile(_ context.Context, id domain.AccountProfileID) (bool, error) {
	if _, ok := s.profiles[id]; !ok {
		return false, nil
	}
	delete(s.profiles, id)
	return true, nil
}

func TestCreateAndResolveEnvironment(t *testing.T) {
	store := newMemoryStore()
	root := t.TempDir()
	svc := New(store, root)
	svc.lookPath = func(string) (string, error) { return "", os.ErrNotExist }

	created, err := svc.Create(context.Background(), CreateInput{Harness: domain.HarnessCodex, Label: "GPT work"})
	if err != nil {
		t.Fatal(err)
	}
	profile := store.profiles[created.ID]
	if profile.ConfigDir != filepath.Join(root, "accounts", string(created.ID)) {
		t.Fatalf("config dir = %q", profile.ConfigDir)
	}
	if info, err := os.Stat(profile.ConfigDir); err != nil || info.Mode().Perm() != 0o700 {
		t.Fatalf("private config dir: info=%v err=%v", info, err)
	}
	env, err := svc.ResolveEnvironment(context.Background(), created.ID, domain.HarnessCodex)
	if err != nil {
		t.Fatal(err)
	}
	if env["CODEX_HOME"] != profile.ConfigDir {
		t.Fatalf("CODEX_HOME = %q", env["CODEX_HOME"])
	}
	if _, ok := env["CLAUDE_CONFIG_DIR"]; ok {
		t.Fatal("Codex profile must not set CLAUDE_CONFIG_DIR")
	}
	if env["CODEX_SQLITE_HOME"] != profile.ConfigDir {
		t.Fatalf("CODEX_SQLITE_HOME = %q", env["CODEX_SQLITE_HOME"])
	}
	if env["OPENAI_API_KEY"] != "" || env["CODEX_ACCESS_TOKEN"] != "" {
		t.Fatal("ambient Codex credentials were not scrubbed")
	}
	configPath := filepath.Join(profile.ConfigDir, "config.toml")
	config, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(config), codexCredentialStoreSetting) {
		t.Fatalf("Codex config does not force file credentials: %s", config)
	}
	if info, err := os.Stat(configPath); err != nil || info.Mode().Perm() != 0o600 {
		t.Fatalf("private Codex config: info=%v err=%v", info, err)
	}
}

func TestCodexConfigPreservesSettingsWhileEnforcingFileCredentials(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.toml")
	input := "model = \"gpt-5\"\ncli_auth_credentials_store = \"keyring\"\n[features]\nfoo = true\n"
	if err := os.WriteFile(path, []byte(input), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := ensureCodexFileCredentialStore(dir); err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	text := string(got)
	if !strings.Contains(text, "model = \"gpt-5\"") || !strings.Contains(text, "foo = true") {
		t.Fatalf("existing Codex settings were lost: %s", text)
	}
	if strings.Contains(text, "keyring") || strings.Count(text, codexCredentialStoreSetting) != 1 {
		t.Fatalf("file credential mode was not enforced exactly once: %s", text)
	}
}

func TestLoginEnvironmentUsesPerProfileOAuthBrowserOnMac(t *testing.T) {
	if runtime.GOOS != "darwin" {
		t.Skip("macOS browser profile integration")
	}
	if _, err := os.Stat("/Applications/Google Chrome.app"); err != nil {
		t.Skip("Google Chrome is not installed")
	}
	store := newMemoryStore()
	svc := New(store, t.TempDir(), WithCredentialVault(newMemoryVault()))
	created, err := svc.Create(context.Background(), CreateInput{Harness: domain.HarnessCodex, Label: "GPT isolated browser"})
	if err != nil {
		t.Fatal(err)
	}
	profile := store.profiles[created.ID]
	env, err := svc.loginEnvironment(profile)
	if err != nil {
		t.Fatal(err)
	}
	launcher := env["BROWSER"]
	if launcher == "" || !strings.HasPrefix(launcher, profile.ConfigDir+string(filepath.Separator)) {
		t.Fatalf("BROWSER launcher is not profile-scoped: %q", launcher)
	}
	data, err := os.ReadFile(launcher)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(data), filepath.Join(profile.ConfigDir, "oauth-browser")) {
		t.Fatalf("browser data directory is not profile-scoped: %s", data)
	}
	if info, err := os.Stat(launcher); err != nil || info.Mode().Perm() != 0o700 {
		t.Fatalf("private OAuth browser launcher: info=%v err=%v", info, err)
	}
}

func TestClaudeCredentialIsProfileScopedAndAmbientSecretsAreRemoved(t *testing.T) {
	store := newMemoryStore()
	vault := newMemoryVault()
	svc := New(store, t.TempDir(), WithCredentialVault(vault))
	created, err := svc.Create(context.Background(), CreateInput{Harness: domain.HarnessClaudeCode, Label: "Claude private"})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := svc.SetCredential(context.Background(), created.ID, "oauth-secret-profile-one"); err != nil {
		t.Fatal(err)
	}
	env, err := svc.ResolveEnvironment(context.Background(), created.ID, domain.HarnessClaudeCode)
	if err != nil {
		t.Fatal(err)
	}
	if env["CLAUDE_CODE_OAUTH_TOKEN"] != "oauth-secret-profile-one" {
		t.Fatal("selected profile token was not injected")
	}
	if env["ANTHROPIC_API_KEY"] != "" || env["ANTHROPIC_AUTH_TOKEN"] != "" {
		t.Fatal("ambient Anthropic credentials were not scrubbed")
	}

	t.Setenv("ANTHROPIC_API_KEY", "ambient-secret")
	merged := mergedEnvironment(env)
	for _, entry := range merged {
		if strings.HasPrefix(entry, "ANTHROPIC_API_KEY=") || strings.Contains(entry, "ambient-secret") {
			t.Fatalf("ambient secret leaked into provider environment: %q", entry)
		}
	}
	if err := svc.ClearCredential(context.Background(), created.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := vault.Get(created.ID); !errors.Is(err, errCredentialNotFound) {
		t.Fatalf("credential still present after clear: %v", err)
	}
}

func TestClaudeProfilesNeverShareCredentialState(t *testing.T) {
	store := newMemoryStore()
	vault := newMemoryVault()
	svc := New(store, t.TempDir(), WithCredentialVault(vault))
	first, err := svc.Create(context.Background(), CreateInput{Harness: domain.HarnessClaudeCode, Label: "Claude one"})
	if err != nil {
		t.Fatal(err)
	}
	second, err := svc.Create(context.Background(), CreateInput{Harness: domain.HarnessClaudeCode, Label: "Claude two"})
	if err != nil {
		t.Fatal(err)
	}
	if store.profiles[first.ID].ConfigDir == store.profiles[second.ID].ConfigDir {
		t.Fatal("Claude profiles share a configuration directory")
	}
	if _, err := svc.SetCredential(context.Background(), first.ID, "oauth-secret-one"); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.SetCredential(context.Background(), second.ID, "oauth-secret-two"); err != nil {
		t.Fatal(err)
	}
	firstEnv, err := svc.ResolveEnvironment(context.Background(), first.ID, domain.HarnessClaudeCode)
	if err != nil {
		t.Fatal(err)
	}
	secondEnv, err := svc.ResolveEnvironment(context.Background(), second.ID, domain.HarnessClaudeCode)
	if err != nil {
		t.Fatal(err)
	}
	if firstEnv["CLAUDE_CODE_OAUTH_TOKEN"] != "oauth-secret-one" ||
		secondEnv["CLAUDE_CODE_OAUTH_TOKEN"] != "oauth-secret-two" {
		t.Fatal("Claude profile credentials crossed account boundaries")
	}
	if err := svc.ClearCredential(context.Background(), first.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := vault.Get(first.ID); !errors.Is(err, errCredentialNotFound) {
		t.Fatalf("first profile credential still present after clear: %v", err)
	}
	if secret, err := vault.Get(second.ID); err != nil || secret != "oauth-secret-two" {
		t.Fatalf("clearing first profile changed second profile: secret=%q err=%v", secret, err)
	}
}

func TestCodexProfilesUseDistinctPrivateHomes(t *testing.T) {
	store := newMemoryStore()
	svc := New(store, t.TempDir())
	first, err := svc.Create(context.Background(), CreateInput{Harness: domain.HarnessCodex, Label: "GPT one"})
	if err != nil {
		t.Fatal(err)
	}
	second, err := svc.Create(context.Background(), CreateInput{Harness: domain.HarnessCodex, Label: "GPT two"})
	if err != nil {
		t.Fatal(err)
	}
	firstEnv, err := svc.ResolveEnvironment(context.Background(), first.ID, domain.HarnessCodex)
	if err != nil {
		t.Fatal(err)
	}
	secondEnv, err := svc.ResolveEnvironment(context.Background(), second.ID, domain.HarnessCodex)
	if err != nil {
		t.Fatal(err)
	}
	if firstEnv["CODEX_HOME"] == secondEnv["CODEX_HOME"] || firstEnv["CODEX_SQLITE_HOME"] == secondEnv["CODEX_SQLITE_HOME"] {
		t.Fatal("Codex profiles share a provider home")
	}
	for _, home := range []string{firstEnv["CODEX_HOME"], secondEnv["CODEX_HOME"]} {
		if info, err := os.Stat(home); err != nil || info.Mode().Perm() != 0o700 {
			t.Fatalf("Codex profile home is not private: home=%q info=%v err=%v", home, info, err)
		}
		config := filepath.Join(home, "config.toml")
		if info, err := os.Stat(config); err != nil || info.Mode().Perm() != 0o600 {
			t.Fatalf("Codex profile config is not private: path=%q info=%v err=%v", config, info, err)
		}
	}
}

func TestResolveRejectsHarnessMismatchAndDisabledProfile(t *testing.T) {
	store := newMemoryStore()
	svc := New(store, t.TempDir())
	created, err := svc.Create(context.Background(), CreateInput{Harness: domain.HarnessClaudeCode, Label: "Claude family"})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := svc.ResolveEnvironment(context.Background(), created.ID, domain.HarnessCodex); err == nil {
		t.Fatal("expected harness mismatch")
	}
	disabled := false
	if _, err := svc.Update(context.Background(), created.ID, UpdateInput{Enabled: &disabled}); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.ResolveEnvironment(context.Background(), created.ID, domain.HarnessClaudeCode); err == nil {
		t.Fatal("expected disabled profile refusal")
	}
}

func TestDeletePreservesProviderDirectory(t *testing.T) {
	store := newMemoryStore()
	svc := New(store, t.TempDir())
	created, err := svc.Create(context.Background(), CreateInput{Harness: domain.HarnessCodex, Label: "GPT backup"})
	if err != nil {
		t.Fatal(err)
	}
	configDir := store.profiles[created.ID].ConfigDir
	if err := svc.Delete(context.Background(), created.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(configDir); err != nil {
		t.Fatalf("provider directory was removed: %v", err)
	}
}

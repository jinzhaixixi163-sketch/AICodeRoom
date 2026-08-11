package aiaccount

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
)

const codexCredentialStoreSetting = `cli_auth_credentials_store = "file"`

var providerCredentialEnvironment = []string{
	"ANTHROPIC_API_KEY",
	"ANTHROPIC_AUTH_TOKEN",
	"CLAUDE_CODE_OAUTH_TOKEN",
	"CLAUDE_CODE_USE_BEDROCK",
	"CLAUDE_CODE_USE_FOUNDRY",
	"CLAUDE_CODE_USE_VERTEX",
	"CODEX_ACCESS_TOKEN",
	"CODEX_API_KEY",
	"OPENAI_ACCESS_TOKEN",
	"OPENAI_API_KEY",
}

// loginEnvironment adds a dedicated browser profile to the already-isolated
// provider environment. This separates OAuth cookies and local storage between
// account profiles without changing the browser or spoofing device identity.
func (s *Service) loginEnvironment(profile domain.AIAccountProfile) (map[string]string, error) {
	env, err := s.environment(profile)
	if err != nil {
		return nil, err
	}
	if runtime.GOOS != "darwin" {
		return env, nil
	}
	if _, err := os.Stat("/Applications/Google Chrome.app"); err != nil {
		return env, nil
	}
	browserDir := filepath.Join(profile.ConfigDir, "oauth-browser")
	if err := ensurePrivateDirectory(browserDir); err != nil {
		return nil, err
	}
	launcher := filepath.Join(profile.ConfigDir, "open-oauth-browser")
	script := "#!/bin/sh\nexec /usr/bin/open -na \"Google Chrome\" --args --user-data-dir=" + shellSingleQuote(browserDir) + " --no-first-run --no-default-browser-check \"$@\"\n"
	if err := os.WriteFile(launcher, []byte(script), 0o700); err != nil {
		return nil, fmt.Errorf("create isolated OAuth browser launcher: %w", err)
	}
	if err := os.Chmod(launcher, 0o700); err != nil {
		return nil, fmt.Errorf("protect isolated OAuth browser launcher: %w", err)
	}
	env["BROWSER"] = launcher
	return env, nil
}

func shellSingleQuote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "'\\''") + "'"
}

func (s *Service) environment(profile domain.AIAccountProfile) (map[string]string, error) {
	if err := ensurePrivateDirectory(profile.ConfigDir); err != nil {
		return nil, err
	}
	env := make(map[string]string, len(providerCredentialEnvironment)+4)
	for _, key := range providerCredentialEnvironment {
		env[key] = ""
	}
	env["AO_AI_ACCOUNT_PROFILE_ID"] = string(profile.ID)

	if profile.Harness == domain.HarnessCodex {
		if err := ensureCodexFileCredentialStore(profile.ConfigDir); err != nil {
			return nil, err
		}
		env["CODEX_HOME"] = profile.ConfigDir
		env["CODEX_SQLITE_HOME"] = profile.ConfigDir
		return env, nil
	}

	env["CLAUDE_CONFIG_DIR"] = profile.ConfigDir
	secret, err := s.vault.Get(profile.ID)
	if err == nil {
		env["CLAUDE_CODE_OAUTH_TOKEN"] = secret
	} else if !errorsIsCredentialNotFound(err) {
		return nil, fmt.Errorf("read isolated Claude credential: %w", err)
	}
	return env, nil
}

func ensurePrivateDirectory(path string) error {
	if err := os.MkdirAll(path, 0o700); err != nil {
		return fmt.Errorf("create account profile directory: %w", err)
	}
	if err := os.Chmod(path, 0o700); err != nil {
		return fmt.Errorf("protect account profile directory: %w", err)
	}
	return nil
}

// ensureCodexFileCredentialStore makes Codex use this profile's auth.json
// instead of the shared OS keychain. It changes only the one top-level setting
// and preserves every other config line.
func ensureCodexFileCredentialStore(configDir string) error {
	path := filepath.Join(configDir, "config.toml")
	data, err := os.ReadFile(path)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("read isolated Codex config: %w", err)
	}

	lines := strings.Split(string(data), "\n")
	found := false
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if !strings.HasPrefix(trimmed, "cli_auth_credentials_store") {
			continue
		}
		if rest := strings.TrimSpace(strings.TrimPrefix(trimmed, "cli_auth_credentials_store")); !strings.HasPrefix(rest, "=") {
			continue
		}
		lines[i] = codexCredentialStoreSetting
		found = true
	}
	if !found {
		if len(data) == 0 {
			lines = []string{codexCredentialStoreSetting, ""}
		} else {
			lines = append([]string{codexCredentialStoreSetting}, lines...)
		}
	}
	updated := []byte(strings.Join(lines, "\n"))
	if string(updated) == string(data) {
		return os.Chmod(path, 0o600)
	}

	tmp, err := os.CreateTemp(configDir, ".config-*.toml")
	if err != nil {
		return fmt.Errorf("create isolated Codex config: %w", err)
	}
	tmpPath := tmp.Name()
	defer func() { _ = os.Remove(tmpPath) }()
	if err := tmp.Chmod(0o600); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("protect isolated Codex config: %w", err)
	}
	if _, err := tmp.Write(updated); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("write isolated Codex config: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close isolated Codex config: %w", err)
	}
	if err := os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("install isolated Codex config: %w", err)
	}
	return os.Chmod(path, 0o600)
}

func errorsIsCredentialNotFound(err error) bool {
	return errors.Is(err, errCredentialNotFound)
}

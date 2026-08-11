package aiaccount

import (
	"errors"

	"github.com/zalando/go-keyring"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
)

const claudeOAuthKeyringService = "AICodeRoom Claude OAuth"

var errCredentialNotFound = errors.New("isolated credential not found")

// CredentialVault keeps subscription tokens out of SQLite, profile files,
// logs, and process arguments. The profile id is the unique keychain account,
// so two Claude profiles can never resolve the same AICodeRoom-managed token.
type CredentialVault interface {
	Get(id domain.AccountProfileID) (string, error)
	Set(id domain.AccountProfileID, secret string) error
	Delete(id domain.AccountProfileID) error
}

type systemCredentialVault struct{}

func (systemCredentialVault) Get(id domain.AccountProfileID) (string, error) {
	secret, err := keyring.Get(claudeOAuthKeyringService, string(id))
	if errors.Is(err, keyring.ErrNotFound) {
		return "", errCredentialNotFound
	}
	return secret, err
}

func (systemCredentialVault) Set(id domain.AccountProfileID, secret string) error {
	return keyring.Set(claudeOAuthKeyringService, string(id), secret)
}

func (systemCredentialVault) Delete(id domain.AccountProfileID) error {
	err := keyring.Delete(claudeOAuthKeyringService, string(id))
	if errors.Is(err, keyring.ErrNotFound) {
		return errCredentialNotFound
	}
	return err
}

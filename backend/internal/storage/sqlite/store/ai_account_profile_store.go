package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
	"github.com/aoagents/agent-orchestrator/backend/internal/storage/sqlite/gen"
)

func (s *Store) ListAIAccountProfiles(ctx context.Context) ([]domain.AIAccountProfile, error) {
	rows, err := s.qr.ListAIAccountProfiles(ctx)
	if err != nil {
		return nil, fmt.Errorf("list AI account profiles: %w", err)
	}
	out := make([]domain.AIAccountProfile, 0, len(rows))
	for _, row := range rows {
		out = append(out, aiAccountProfileFromRow(row))
	}
	return out, nil
}

func (s *Store) GetAIAccountProfile(ctx context.Context, id domain.AccountProfileID) (domain.AIAccountProfile, bool, error) {
	row, err := s.qr.GetAIAccountProfile(ctx, string(id))
	if errors.Is(err, sql.ErrNoRows) {
		return domain.AIAccountProfile{}, false, nil
	}
	if err != nil {
		return domain.AIAccountProfile{}, false, fmt.Errorf("get AI account profile %s: %w", id, err)
	}
	return aiAccountProfileFromRow(row), true, nil
}

func (s *Store) InsertAIAccountProfile(ctx context.Context, profile domain.AIAccountProfile) error {
	s.writeMu.Lock()
	defer s.writeMu.Unlock()
	if err := s.qw.InsertAIAccountProfile(ctx, gen.InsertAIAccountProfileParams{
		ID:        string(profile.ID),
		Harness:   string(profile.Harness),
		Label:     profile.Label,
		ConfigDir: profile.ConfigDir,
		Enabled:   profile.Enabled,
		CreatedAt: profile.CreatedAt,
		UpdatedAt: profile.UpdatedAt,
	}); err != nil {
		return fmt.Errorf("insert AI account profile %s: %w", profile.ID, err)
	}
	return nil
}

func (s *Store) SetAIAccountProfileEnabled(ctx context.Context, id domain.AccountProfileID, enabled bool, now time.Time) (bool, error) {
	s.writeMu.Lock()
	defer s.writeMu.Unlock()
	rows, err := s.qw.SetAIAccountProfileEnabled(ctx, gen.SetAIAccountProfileEnabledParams{
		Enabled:   enabled,
		UpdatedAt: now,
		ID:        string(id),
	})
	if err != nil {
		return false, fmt.Errorf("set AI account profile %s enabled: %w", id, err)
	}
	return rows > 0, nil
}

func (s *Store) RenameAIAccountProfile(ctx context.Context, id domain.AccountProfileID, label string, now time.Time) (bool, error) {
	s.writeMu.Lock()
	defer s.writeMu.Unlock()
	rows, err := s.qw.RenameAIAccountProfile(ctx, gen.RenameAIAccountProfileParams{
		Label:     label,
		UpdatedAt: now,
		ID:        string(id),
	})
	if err != nil {
		return false, fmt.Errorf("rename AI account profile %s: %w", id, err)
	}
	return rows > 0, nil
}

func (s *Store) DeleteAIAccountProfile(ctx context.Context, id domain.AccountProfileID) (bool, error) {
	s.writeMu.Lock()
	defer s.writeMu.Unlock()
	rows, err := s.qw.DeleteAIAccountProfile(ctx, string(id))
	if err != nil {
		return false, fmt.Errorf("delete AI account profile %s: %w", id, err)
	}
	return rows > 0, nil
}

func aiAccountProfileFromRow(row gen.AiAccountProfile) domain.AIAccountProfile {
	return domain.AIAccountProfile{
		ID:        domain.AccountProfileID(row.ID),
		Harness:   domain.AgentHarness(row.Harness),
		Label:     row.Label,
		ConfigDir: row.ConfigDir,
		Enabled:   row.Enabled,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}
}

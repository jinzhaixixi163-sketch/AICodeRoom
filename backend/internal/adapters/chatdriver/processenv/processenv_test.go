package processenv

import (
	"slices"
	"strings"
	"testing"
)

func TestMergeInheritsDaemonEnvironmentAndAppliesOverlay(t *testing.T) {
	t.Setenv("AO_PROCESSENV_INHERITED", "parent")
	t.Setenv("AO_PROCESSENV_REPLACED", "old")

	got := Merge(map[string]string{
		"AO_PROCESSENV_REPLACED": "new",
		"AO_PROCESSENV_SESSION":  "session",
	})
	if !slices.IsSorted(got) {
		t.Fatalf("environment is not sorted: %v", got)
	}
	want := map[string]string{
		"AO_PROCESSENV_INHERITED": "parent",
		"AO_PROCESSENV_REPLACED":  "new",
		"AO_PROCESSENV_SESSION":   "session",
	}
	for _, entry := range got {
		key, value, ok := strings.Cut(entry, "=")
		if ok {
			if expected, exists := want[key]; exists {
				if value != expected {
					t.Fatalf("%s = %q, want %q", key, value, expected)
				}
				delete(want, key)
			}
		}
	}
	if len(want) != 0 {
		t.Fatalf("missing environment values: %v", want)
	}
}

func TestMergeCanBlankAmbientProviderCredential(t *testing.T) {
	t.Setenv("OPENAI_API_KEY", "ambient-secret-must-not-survive")

	got := Merge(map[string]string{"OPENAI_API_KEY": ""})
	for _, entry := range got {
		if entry == "OPENAI_API_KEY=ambient-secret-must-not-survive" {
			t.Fatal("ambient provider credential survived the session overlay")
		}
		if entry == "OPENAI_API_KEY=" {
			return
		}
	}
	t.Fatal("credential scrub overlay was missing from child environment")
}

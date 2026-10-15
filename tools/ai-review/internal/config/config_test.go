package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func fixture(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	data, err := os.ReadFile("../../../../.ai-review/config.yaml")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "config.yaml"), data, 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(dir, "criteria"), 0700); err != nil {
		t.Fatal(err)
	}
	for _, file := range []string{"instructions.md", "custom-prompt.md", "criteria/correctness.md", "criteria/security.md"} {
		if err := os.WriteFile(filepath.Join(dir, file), []byte("Review instructions"), 0600); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

func TestLoadAndHash(t *testing.T) {
	dir := fixture(t)
	a, err := Load(dir)
	if err != nil {
		t.Fatal(err)
	}
	b, err := Load(dir)
	if err != nil {
		t.Fatal(err)
	}
	if a.Hash != b.Hash {
		t.Fatal("unstable hash")
	}
	if err := os.WriteFile(filepath.Join(dir, "instructions.md"), []byte("changed"), 0600); err != nil {
		t.Fatal(err)
	}
	c, err := Load(dir)
	if err != nil {
		t.Fatal(err)
	}
	if a.Hash == c.Hash {
		t.Fatal("instructions absent from hash")
	}
}

func TestRejectInvalidPolicy(t *testing.T) {
	for _, test := range []struct{ name, old, replacement string }{
		{"unknown field", "version: 1", "version: 1\nendpoint: https://attacker.invalid"},
		{"traversal", "instructions: instructions.md", "instructions: ../instructions.md"},
		{"fail open", "onIncomplete: block", "onIncomplete: allow"},
		{"multiple documents", "version: 1", "---\nversion: 1\n---\nversion: 1"},
	} {
		t.Run(test.name, func(t *testing.T) {
			dir := fixture(t)
			file := filepath.Join(dir, "config.yaml")
			data, err := os.ReadFile(file)
			if err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(file, []byte(strings.Replace(string(data), test.old, test.replacement, 1)), 0600); err != nil {
				t.Fatal(err)
			}
			if _, err := Load(dir); err == nil {
				t.Fatal("invalid policy accepted")
			}
		})
	}
}

func TestRejectSymlink(t *testing.T) {
	dir := fixture(t)
	file := filepath.Join(dir, "instructions.md")
	if err := os.Remove(file); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink("custom-prompt.md", file); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(dir); err == nil {
		t.Fatal("symlink accepted")
	}
}

func TestMatches(t *testing.T) {
	if !Matches("services/backend/**", "services/backend/src/test.ts") || Matches("services/backend/**", "services/backend-other/test.ts") || Matches("**", "../secret") {
		t.Fatal("incorrect path matching")
	}
}

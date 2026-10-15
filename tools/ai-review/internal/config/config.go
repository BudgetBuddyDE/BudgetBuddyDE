// Package config loads bounded repository policy from a trusted directory.
package config

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path"
	"strings"
	"time"

	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/review"
	"go.yaml.in/yaml/v3"
)

const MaxFileBytes = 128 * 1024

type Criterion struct {
	ID           string          `yaml:"id"`
	Instructions string          `yaml:"instructions"`
	Paths        []string        `yaml:"paths"`
	BlockingFrom review.Severity `yaml:"blockingFrom"`
}

type Config struct {
	Version int `yaml:"version"`
	Review  struct {
		Language     string `yaml:"language"`
		Instructions string `yaml:"instructions"`
		CustomPrompt string `yaml:"customPrompt"`
	} `yaml:"review"`
	Criteria []Criterion `yaml:"criteria"`
	Gate     struct {
		OnIncomplete    string `yaml:"onIncomplete"`
		OnProviderError string `yaml:"onProviderError"`
		OnInvalidResult string `yaml:"onInvalidResult"`
	} `yaml:"gate"`
	Limits struct {
		Timeout       string `yaml:"timeout"`
		MaxModelCalls int    `yaml:"maxModelCalls"`
	} `yaml:"limits"`
	Publishing struct {
		MaxInlineComments int  `yaml:"maxInlineComments"`
		Suggestions       bool `yaml:"suggestions"`
		UpdateSummary     bool `yaml:"updateSummary"`
	} `yaml:"publishing"`
}

type Policy struct {
	Config    Config
	Hash      string
	Documents map[string]string
}

// Load never follows symlinks beneath dir. The caller must supply a directory
// materialized from the trusted policy commit, not the pull-request checkout.
func Load(dir string) (Policy, error) {
	root, err := os.OpenRoot(dir)
	if err != nil {
		return Policy{}, err
	}
	defer root.Close()
	data, err := readFile(root, "config.yaml")
	if err != nil {
		return Policy{}, err
	}
	cfg, err := Parse(data)
	if err != nil {
		return Policy{}, err
	}
	docs := map[string]string{"config.yaml": string(data)}
	files := []string{cfg.Review.Instructions}
	if cfg.Review.CustomPrompt != "" {
		files = append(files, cfg.Review.CustomPrompt)
	}
	for _, c := range cfg.Criteria {
		files = append(files, c.Instructions)
	}
	for _, file := range files {
		content, err := readFile(root, file)
		if err != nil {
			return Policy{}, fmt.Errorf("load %s: %w", file, err)
		}
		if len(bytes.TrimSpace(content)) == 0 {
			return Policy{}, fmt.Errorf("empty instructions: %s", file)
		}
		docs[file] = string(content)
	}
	encoded, err := json.Marshal(docs)
	if err != nil {
		return Policy{}, err
	}
	hash := sha256.Sum256(encoded)
	return Policy{Config: cfg, Hash: hex.EncodeToString(hash[:]), Documents: docs}, nil
}

func Parse(data []byte) (Config, error) {
	var cfg Config
	dec := yaml.NewDecoder(bytes.NewReader(data))
	dec.KnownFields(true)
	if err := dec.Decode(&cfg); err != nil {
		return Config{}, err
	}
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		return Config{}, fmt.Errorf("policy must contain exactly one YAML document")
	}
	if err := cfg.Validate(); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func readFile(root *os.Root, name string) ([]byte, error) {
	if !safePath(name) {
		return nil, fmt.Errorf("invalid policy path %q", name)
	}
	parts := strings.Split(name, "/")
	for i := range parts {
		info, err := root.Lstat(strings.Join(parts[:i+1], "/"))
		if err != nil {
			return nil, err
		}
		if info.Mode()&os.ModeSymlink != 0 {
			return nil, fmt.Errorf("symlink not allowed: %s", name)
		}
	}
	f, err := root.Open(name)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return nil, err
	}
	if !info.Mode().IsRegular() {
		return nil, fmt.Errorf("not a regular file: %s", name)
	}
	data, err := io.ReadAll(io.LimitReader(f, MaxFileBytes+1))
	if err != nil {
		return nil, err
	}
	if len(data) > MaxFileBytes {
		return nil, fmt.Errorf("policy file exceeds byte limit: %s", name)
	}
	return data, nil
}

func safePath(name string) bool {
	return name != "" && name != "." && name != ".." && !path.IsAbs(name) && path.Clean(name) == name && !strings.ContainsAny(name, "\\\x00\r\n") && !strings.HasPrefix(name, "../")
}

func (c Config) Validate() error {
	if c.Version != 1 {
		return fmt.Errorf("unsupported policy version %d", c.Version)
	}
	if !safePath(c.Review.Instructions) {
		return fmt.Errorf("review.instructions must be a relative file path")
	}
	if c.Review.CustomPrompt != "" && !safePath(c.Review.CustomPrompt) {
		return fmt.Errorf("invalid custom prompt path")
	}
	if c.Gate.OnIncomplete != "block" || c.Gate.OnProviderError != "block" || c.Gate.OnInvalidResult != "block" {
		return fmt.Errorf("all failure policies must be block")
	}
	duration, err := time.ParseDuration(c.Limits.Timeout)
	if err != nil || duration <= 0 || c.Limits.MaxModelCalls <= 0 {
		return fmt.Errorf("positive timeout and maxModelCalls required")
	}
	if c.Publishing.MaxInlineComments < 0 {
		return fmt.Errorf("maxInlineComments must not be negative")
	}
	if len(c.Criteria) == 0 || len(c.Criteria) > 100 {
		return fmt.Errorf("between 1 and 100 criteria required")
	}
	ids := map[string]bool{}
	for _, criterion := range c.Criteria {
		if criterion.ID == "" || ids[criterion.ID] {
			return fmt.Errorf("empty or duplicate criterion ID %q", criterion.ID)
		}
		ids[criterion.ID] = true
		if !safePath(criterion.Instructions) || criterion.BlockingFrom.Rank() == 0 || len(criterion.Paths) == 0 {
			return fmt.Errorf("invalid criterion %q", criterion.ID)
		}
		for _, pattern := range criterion.Paths {
			// Version 1 supports all files, exact paths and directory-prefix globs.
			prefix := strings.TrimSuffix(pattern, "/**")
			if pattern != "**" && (!safePath(prefix) || strings.ContainsAny(prefix, "*?[]{}")) {
				return fmt.Errorf("unsupported path pattern %q", pattern)
			}
		}
	}
	return nil
}

func Matches(pattern, file string) bool {
	if !safePath(file) {
		return false
	}
	if pattern == "**" {
		return true
	}
	if strings.HasSuffix(pattern, "/**") {
		return strings.HasPrefix(file, strings.TrimSuffix(pattern, "**"))
	}
	return pattern == file
}

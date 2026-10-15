package runner

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"path"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/config"
)

type pull struct {
	State string `json:"state"`
	Head  struct {
		SHA string `json:"sha"`
	} `json:"head"`
	Base struct {
		SHA string `json:"sha"`
		Ref string `json:"ref"`
	} `json:"base"`
}

type file struct {
	Name     string `json:"filename"`
	Previous string `json:"previous_filename"`
	Status   string `json:"status"`
	Patch    string `json:"patch"`
	Content  string
	Side     string
	Lines    map[int]bool
}

var hunk = regexp.MustCompile(`^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@`)

// diffLines identifies only changed lines; context lines are not suggestion anchors.
func diffLines(patch, side string) (map[int]bool, error) {
	result := map[int]bool{}
	oldLine, newLine, oldRemaining, newRemaining := 0, 0, 0, 0
	seen := false
	for _, line := range strings.Split(strings.TrimSuffix(patch, "\n"), "\n") {
		if m := hunk.FindStringSubmatch(line); m != nil {
			if oldRemaining != 0 || newRemaining != 0 {
				return nil, fmt.Errorf("truncated hunk")
			}
			oldLine, _ = strconv.Atoi(m[1])
			newLine, _ = strconv.Atoi(m[3])
			oldRemaining = 1
			newRemaining = 1
			if m[2] != "" {
				oldRemaining, _ = strconv.Atoi(m[2])
			}
			if m[4] != "" {
				newRemaining, _ = strconv.Atoi(m[4])
			}
			seen = true
			continue
		}
		if strings.HasPrefix(line, "\\") {
			continue
		}
		if !seen || line == "" {
			return nil, fmt.Errorf("invalid patch")
		}
		switch line[0] {
		case '-':
			if side == "LEFT" {
				result[oldLine] = true
			}
			oldLine++
			oldRemaining--
		case '+':
			if side == "RIGHT" {
				result[newLine] = true
			}
			newLine++
			newRemaining--
		case ' ':
			oldLine++
			newLine++
			oldRemaining--
			newRemaining--
		default:
			return nil, fmt.Errorf("invalid patch line")
		}
		if oldRemaining < 0 || newRemaining < 0 {
			return nil, fmt.Errorf("invalid hunk lengths")
		}
	}
	if !seen || oldRemaining != 0 || newRemaining != 0 {
		return nil, fmt.Errorf("missing or truncated patch")
	}
	return result, nil
}

func (g githubClient) content(ctx context.Context, repo, name, sha string) ([]byte, error) {
	// The Contents API can dereference symlinks and return type=file. Inspect Git
	// modes first so a policy symlink can never redirect trusted instructions.
	if !safeName(name) || !shaPattern.MatchString(sha) {
		return nil, fmt.Errorf("invalid content reference")
	}
	treeSHA := sha
	parts := strings.Split(name, "/")
	for i, part := range parts {
		var tree struct {
			Truncated bool `json:"truncated"`
			Entries   []struct {
				Path string `json:"path"`
				Mode string `json:"mode"`
				SHA  string `json:"sha"`
			} `json:"tree"`
		}
		if err := g.call(ctx, "GET", "/repos/"+repo+"/git/trees/"+treeSHA, nil, &tree); err != nil {
			return nil, err
		}
		if tree.Truncated {
			return nil, fmt.Errorf("truncated Git tree")
		}
		found := false
		for _, entry := range tree.Entries {
			if entry.Path != part {
				continue
			}
			found = true
			if !shaPattern.MatchString(entry.SHA) {
				return nil, fmt.Errorf("invalid Git tree reference")
			}
			if i == len(parts)-1 {
				if entry.Mode != "100644" && entry.Mode != "100755" {
					return nil, fmt.Errorf("non-regular Git object")
				}
			} else if entry.Mode != "040000" {
				return nil, fmt.Errorf("non-directory Git object")
			}
			treeSHA = entry.SHA
			break
		}
		if !found {
			return nil, fmt.Errorf("missing Git path")
		}
	}
	var result struct {
		Type     string `json:"type"`
		Encoding string `json:"encoding"`
		Content  string `json:"content"`
		Size     int    `json:"size"`
	}
	err := g.call(ctx, "GET", "/repos/"+repo+"/contents/"+escapePath(name)+"?ref="+sha, nil, &result)
	if err != nil {
		return nil, err
	}
	if result.Type != "file" || result.Encoding != "base64" || result.Size > 128*1024 {
		return nil, fmt.Errorf("unsupported or oversized source file")
	}
	b, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(result.Content, "\n", ""))
	if err != nil || len(b) > 128*1024 || !utf8.Valid(b) || strings.ContainsRune(string(b), 0) {
		return nil, fmt.Errorf("invalid source content")
	}
	return b, nil
}

func safeName(name string) bool {
	return name != "" && name != "." && name != ".." && path.Clean(name) == name && !path.IsAbs(name) && !strings.HasPrefix(name, "../") && !strings.ContainsAny(name, "\\\x00\r\n")
}

func (g githubClient) policy(ctx context.Context, repo, sha string) (config.Policy, error) {
	// Bootstrap only the config to discover explicit instruction paths. Load then
	// validates all files through the same bounded filesystem implementation.
	dir, err := os.MkdirTemp("", "ai-review-policy-")
	if err != nil {
		return config.Policy{}, err
	}
	defer os.RemoveAll(dir)
	b, err := g.content(ctx, repo, ".ai-review/config.yaml", sha)
	if err != nil {
		return config.Policy{}, err
	}
	// Decode with the same strict config decoder, before following any paths.
	cfg, err := config.Parse(b)
	if err != nil {
		return config.Policy{}, err
	}
	if err = os.WriteFile(path.Join(dir, "config.yaml"), b, 0600); err != nil {
		return config.Policy{}, err
	}
	names := []string{cfg.Review.Instructions}
	if cfg.Review.CustomPrompt != "" {
		names = append(names, cfg.Review.CustomPrompt)
	}
	for _, c := range cfg.Criteria {
		names = append(names, c.Instructions)
	}
	for _, name := range names {
		if !safeName(name) {
			return config.Policy{}, fmt.Errorf("invalid instruction path")
		}
		b, err = g.content(ctx, repo, ".ai-review/"+name, sha)
		if err != nil {
			return config.Policy{}, err
		}
		if err = os.MkdirAll(path.Dir(path.Join(dir, name)), 0700); err != nil {
			return config.Policy{}, err
		}
		if err = os.WriteFile(path.Join(dir, name), b, 0600); err != nil {
			return config.Policy{}, err
		}
	}
	return config.Load(dir)
}

func (g githubClient) files(ctx context.Context, repo string, pr int, p pull) ([]file, error) {
	var files []file
	for page := 1; page <= 2; page++ {
		var batch []file
		if err := g.call(ctx, "GET", fmt.Sprintf("/repos/%s/pulls/%d/files?per_page=100&page=%d", repo, pr, page), nil, &batch); err != nil {
			return nil, err
		}
		files = append(files, batch...)
		if len(files) > 100 {
			return nil, fmt.Errorf("PR exceeds 100-file limit")
		}
		if len(batch) < 100 {
			break
		}
	}
	if len(files) == 0 {
		return nil, fmt.Errorf("empty PR diff")
	}
	// Removed files use the merge-base content, not the latest target content.
	var comparison struct {
		MergeBase struct {
			SHA string `json:"sha"`
		} `json:"merge_base_commit"`
	}
	if err := g.call(ctx, "GET", "/repos/"+repo+"/compare/"+p.Base.SHA+"..."+p.Head.SHA, nil, &comparison); err != nil {
		return nil, err
	}
	if !shaPattern.MatchString(comparison.MergeBase.SHA) {
		return nil, fmt.Errorf("invalid merge base")
	}
	total := 0
	for i := range files {
		f := &files[i]
		if !safeName(f.Name) {
			return nil, fmt.Errorf("unsupported file path")
		}
		if f.Status != "added" && f.Status != "modified" && f.Status != "removed" && f.Status != "renamed" {
			return nil, fmt.Errorf("unsupported change type")
		}
		f.Side = "RIGHT"
		ref := p.Head.SHA
		if f.Status == "removed" {
			f.Side = "LEFT"
			ref = comparison.MergeBase.SHA
		}
		lines, err := diffLines(f.Patch, f.Side)
		if err != nil {
			return nil, fmt.Errorf("cannot fully map diff: %s", f.Name)
		}
		f.Lines = lines
		b, err := g.content(ctx, repo, f.Name, ref)
		if err != nil {
			return nil, fmt.Errorf("cannot load source: %s", f.Name)
		}
		f.Content = string(b)
		total += len(b) + len(f.Patch)
		if total > 2*1024*1024 {
			return nil, fmt.Errorf("PR exceeds total content limit")
		}
	}
	return files, nil
}

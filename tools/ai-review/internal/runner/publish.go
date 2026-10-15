package runner

import (
	"context"
	"crypto/sha256"
	"fmt"
	"strings"

	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/review"
)

type publishedComment struct {
	ID   int64  `json:"id"`
	Body string `json:"body"`
	User struct {
		Login string `json:"login"`
		Type  string `json:"type"`
	} `json:"user"`
}

func (g githubClient) comments(ctx context.Context, endpoint string) ([]publishedComment, error) {
	var all []publishedComment
	for page := 1; page <= 20; page++ {
		var batch []publishedComment
		if err := g.call(ctx, "GET", fmt.Sprintf("%s?per_page=100&page=%d", endpoint, page), nil, &batch); err != nil {
			return nil, err
		}
		all = append(all, batch...)
		if len(batch) < 100 {
			return all, nil
		}
	}
	return nil, fmt.Errorf("comment pagination budget exceeded")
}

func (g githubClient) publish(ctx context.Context, o Options, p pull, identity, hash string, r review.Report, d review.Decision, files []file, limit int, suggestions bool) error {
	// App identity is obtained from an authenticated app JWT, not a marker supplied
	// by a commenter. Bot login is GitHub's canonical app-slug identity.
	jwt, err := appJWT(o.AppID, o.PrivateKey)
	if err != nil {
		return err
	}
	var app struct {
		Slug string `json:"slug"`
	}
	if err := (githubClient{g.client, jwt}).call(ctx, "GET", "/app", nil, &app); err != nil {
		return err
	}
	if app.Slug == "" {
		return fmt.Errorf("missing app slug")
	}
	login := app.Slug + "[bot]"
	prefix := "/repos/" + o.Repository
	existing, err := g.comments(ctx, fmt.Sprintf("%s/pulls/%d/comments", prefix, o.PR))
	if err != nil {
		return err
	}
	seen := map[string]bool{}
	for _, c := range existing {
		if c.User.Login == login && c.User.Type == "Bot" {
			seen[c.Body] = true
		}
	}
	byName := map[string]file{}
	for _, f := range files {
		byName[f.Name] = f
	}
	count := 0
	for _, finding := range r.Findings {
		if count >= limit {
			break
		}
		f := byName[finding.Path]
		inline := true
		for line := finding.StartLine; line <= finding.EndLine; line++ {
			if !f.Lines[line] {
				inline = false
			}
		}
		if !inline {
			continue
		}
		count++
		fingerprint := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%d:%d:%s:%s", p.Head.SHA, finding.Path, finding.StartLine, finding.EndLine, finding.CriterionID, finding.Title)))
		marker := fmt.Sprintf("<!-- ai-review-finding:%x -->", fingerprint)
		already := false
		for body := range seen {
			if strings.Contains(body, marker) {
				already = true
				break
			}
		}
		if already {
			continue
		}
		body := marker + "\n" + safeText(string(finding.Severity)+" / "+finding.CriterionID+": "+finding.Title) + "\n\n" + safeText(finding.Explanation)
		if suggestions && finding.Side == "RIGHT" && finding.Replacement != nil && !strings.Contains(*finding.Replacement, "```") && !strings.Contains(*finding.Replacement, "\r") {
			body += "\n\n```suggestion\n" + *finding.Replacement + "\n```"
		}
		comment := map[string]any{"path": finding.Path, "line": finding.EndLine, "side": finding.Side, "body": body}
		if finding.StartLine != finding.EndLine {
			comment["start_line"] = finding.StartLine
			comment["start_side"] = finding.Side
		}
		if err := g.call(ctx, "POST", fmt.Sprintf("%s/pulls/%d/reviews", prefix, o.PR), map[string]any{"commit_id": p.Head.SHA, "event": "COMMENT", "body": "AI review finding", "comments": []any{comment}}, nil); err != nil {
			return err
		}
	}
	comments, err := g.comments(ctx, fmt.Sprintf("%s/issues/%d/comments", prefix, o.PR))
	if err != nil {
		return err
	}
	marker := "<!-- ai-review-summary -->"
	body := marker + "\n" + summary(p, hash, r, d) + "\n\nRun: " + identity
	for _, c := range comments {
		if c.User.Login == login && c.User.Type == "Bot" && strings.HasPrefix(c.Body, marker) {
			return g.call(ctx, "PATCH", fmt.Sprintf("%s/issues/comments/%d", prefix, c.ID), map[string]string{"body": body}, nil)
		}
	}
	return g.call(ctx, "POST", fmt.Sprintf("%s/issues/%d/comments", prefix, o.PR), map[string]string{"body": body}, nil)
}

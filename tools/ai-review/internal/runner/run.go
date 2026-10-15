package runner

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/policy"
	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/review"
)

const runnerVersion = "1"

var shaPattern = regexp.MustCompile(`^[0-9a-f]{40}$`)
var repoPattern = regexp.MustCompile(`^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$`)

type Options struct {
	Repository     string
	PR             int
	ExpectedHead   string
	BaseBranch     string
	AppID          string
	InstallationID string
	PrivateKey     string
	Endpoint       string
	APIKey         string
	Model          string
	Bucket         string
	MaxCalls       int
}

func Environment() (Options, error) {
	pr, err := strconv.Atoi(os.Getenv("REVIEW_PR"))
	if err != nil {
		return Options{}, fmt.Errorf("REVIEW_PR required")
	}
	calls := 20
	if v := os.Getenv("REVIEW_MAX_CALLS"); v != "" {
		calls, err = strconv.Atoi(v)
		if err != nil {
			return Options{}, fmt.Errorf("invalid REVIEW_MAX_CALLS")
		}
	}
	o := Options{Repository: os.Getenv("REVIEW_REPOSITORY"), PR: pr, ExpectedHead: os.Getenv("REVIEW_HEAD_SHA"), BaseBranch: os.Getenv("REVIEW_BASE_BRANCH"), AppID: os.Getenv("GITHUB_APP_ID"), InstallationID: os.Getenv("GITHUB_INSTALLATION_ID"), PrivateKey: os.Getenv("GITHUB_APP_PRIVATE_KEY"), Endpoint: os.Getenv("LITELLM_BASE_URL"), APIKey: os.Getenv("LITELLM_API_KEY"), Model: os.Getenv("LITELLM_MODEL"), Bucket: os.Getenv("REVIEW_S3_BUCKET"), MaxCalls: calls}
	if !repoPattern.MatchString(o.Repository) || o.PR < 1 || !shaPattern.MatchString(o.ExpectedHead) || o.BaseBranch == "" || o.MaxCalls < 1 || o.MaxCalls > 100 {
		return o, fmt.Errorf("invalid review identity or limits")
	}
	for _, v := range []string{o.AppID, o.InstallationID} {
		if _, err := strconv.ParseUint(v, 10, 64); err != nil {
			return o, fmt.Errorf("invalid GitHub app identifiers")
		}
	}
	if o.PrivateKey == "" || o.Endpoint == "" || o.APIKey == "" || o.Model == "" || o.Bucket == "" {
		return o, fmt.Errorf("GitHub, LiteLLM and S3 configuration required")
	}
	return o, nil
}

// Run is a trusted, tool-free orchestrator. The model only receives explicitly
// serialized source and instructions, never environment variables or capabilities.
func Run(ctx context.Context, o Options) (returnErr error) {
	ctx, cancel := context.WithTimeout(ctx, 15*time.Minute)
	defer cancel()
	jwt, err := appJWT(o.AppID, o.PrivateKey)
	if err != nil {
		return err
	}
	token, err := installationToken(ctx, jwt, o.InstallationID, o.Repository, true)
	if err != nil {
		return err
	}
	g := githubClient{httpClient(), token}
	checkID := int64(0)
	completed := false
	defer func() {
		if returnErr == nil || checkID == 0 || completed {
			return
		}
		cleanup, done := context.WithTimeout(context.Background(), 30*time.Second)
		defer done()
		// The check reports a generic error; logs contain bounded operational metadata only.
		_ = g.call(cleanup, "PATCH", fmt.Sprintf("/repos/%s/check-runs/%d", o.Repository, checkID), map[string]any{"status": "completed", "conclusion": "failure", "output": map[string]string{"title": "Review incomplete", "summary": "Review failed or snapshot became stale. No approval was granted. See trusted Concourse logs."}}, nil)
	}()
	var check struct {
		ID int64 `json:"id"`
	}
	if err := g.call(ctx, "POST", "/repos/"+o.Repository+"/check-runs", map[string]any{"name": "ai-review/gate", "head_sha": o.ExpectedHead, "status": "in_progress"}, &check); err != nil {
		return err
	}
	checkID = check.ID
	if checkID == 0 {
		return fmt.Errorf("missing check ID")
	}
	p, err := g.getPull(ctx, o)
	if err != nil {
		return err
	}
	trusted, err := g.policy(ctx, o.Repository, p.Base.SHA)
	if err != nil {
		return fmt.Errorf("trusted policy unavailable: %w", err)
	}
	duration, _ := time.ParseDuration(trusted.Config.Limits.Timeout)
	if duration > 10*time.Minute {
		duration = 10 * time.Minute
	}
	analysisCtx, stop := context.WithTimeout(ctx, duration)
	defer stop()
	files, err := g.files(analysisCtx, o.Repository, o.PR, p)
	if err != nil {
		return err
	}
	if _, err = g.getUnchanged(ctx, o, p); err != nil {
		return err
	}
	buildHash, err := executableHash()
	if err != nil {
		return err
	}
	identityData, _ := json.Marshal([]string{o.Repository, strconv.Itoa(o.PR), p.Head.SHA, p.Base.SHA, trusted.Hash, runnerVersion, buildHash, o.Endpoint, o.Model})
	digest := sha256.Sum256(identityData)
	identity := hex.EncodeToString(digest[:])
	key := "reviews/" + o.Repository + "/" + strconv.Itoa(o.PR) + "/" + identity + ".json"
	s, err := newStore(ctx, o.Bucket)
	if err != nil {
		return err
	}
	cached, err := s.load(ctx, key)
	if err != nil {
		return err
	}
	var report review.Report
	if cached != nil {
		if cached.Identity != identity {
			return fmt.Errorf("stored identity mismatch")
		}
		report = cached.Report
		if err := verifyReport(report, files); err != nil {
			return err
		}
	} else {
		report, err = analyze(analysisCtx, o.Endpoint, o.APIKey, o.Model, trusted, files, o.MaxCalls)
		if err != nil {
			return err
		}
		if err := verifyReport(report, files); err != nil {
			return err
		}
		if err := s.save(ctx, key, stored{identity, report}); err != nil {
			return err
		}
	}
	decision := policy.Evaluate(trusted.Config, report)
	if _, err = g.getUnchanged(ctx, o, p); err != nil {
		return err
	}
	if err := g.publish(ctx, o, p, identity, trusted.Hash, report, decision, files, trusted.Config.Publishing.MaxInlineComments, trusted.Config.Publishing.Suggestions); err != nil {
		return err
	}
	if _, err = g.getUnchanged(ctx, o, p); err != nil {
		return err
	}
	conclusion := "failure"
	if decision.Allowed {
		conclusion = "success"
	}
	if err := g.call(ctx, "PATCH", fmt.Sprintf("/repos/%s/check-runs/%d", o.Repository, checkID), map[string]any{"status": "completed", "conclusion": conclusion, "output": map[string]string{"title": "AI review: " + conclusion, "summary": summary(p, trusted.Hash, report, decision)}}, nil); err != nil {
		return err
	}
	completed = true
	if !decision.Allowed {
		return fmt.Errorf("review contains blocking findings or invalid analysis")
	}
	return nil
}

// A runner change must invalidate cached analysis even if its protocol version
// stays the same. Hash the actual executable rather than mutable image tags.
func executableHash() (string, error) {
	name, err := os.Executable()
	if err != nil {
		return "", err
	}
	f, err := os.Open(name)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func (g githubClient) getPull(ctx context.Context, o Options) (pull, error) {
	var p pull
	if err := g.call(ctx, "GET", fmt.Sprintf("/repos/%s/pulls/%d", o.Repository, o.PR), nil, &p); err != nil {
		return p, err
	}
	if p.State != "open" || p.Head.SHA != o.ExpectedHead || !shaPattern.MatchString(p.Base.SHA) || p.Base.Ref != o.BaseBranch {
		return p, fmt.Errorf("PR is closed, stale or targets unexpected branch")
	}
	return p, nil
}

func (g githubClient) getUnchanged(ctx context.Context, o Options, original pull) (pull, error) {
	p, err := g.getPull(ctx, o)
	if err != nil {
		return p, err
	}
	if p.Base.SHA != original.Base.SHA {
		return p, fmt.Errorf("target branch changed during review")
	}
	return p, nil
}

func verifyReport(r review.Report, files []file) error {
	if r.Version != 1 || len(r.Errors) > 0 || len(r.PlannedUnits) != len(files) || len(r.CompletedUnits) != len(files) {
		return fmt.Errorf("stored analysis incomplete")
	}
	byName := map[string]file{}
	for i, f := range files {
		byName[f.Name] = f
		if r.PlannedUnits[i] != f.Name || r.CompletedUnits[i] != f.Name {
			return fmt.Errorf("analysis plan mismatch")
		}
	}
	for _, finding := range r.Findings {
		f, ok := byName[finding.Path]
		if !ok {
			return fmt.Errorf("finding outside snapshot")
		}
		if err := validateFinding(finding, f); err != nil {
			return err
		}
	}
	return nil
}

func safeText(text string) string {
	text = strings.ReplaceAll(text, "://", ": / /")
	// Strip active Markdown syntax and mentions rather than publishing raw model Markdown.
	return strings.Map(func(r rune) rune {
		if strings.ContainsRune("<>[]!`*_@\\", r) || r < 32 && r != '\n' && r != '\t' {
			return ' '
		}
		return r
	}, text)
}

func summary(p pull, hash string, r review.Report, d review.Decision) string {
	status := "BLOCKED"
	if d.Allowed {
		status = "PASSED"
	}
	var b strings.Builder
	fmt.Fprintf(&b, "AI review: %s\n\nHead: %s\nBase: %s\nPolicy: %s\nCoverage: %d/%d units\nFindings: %d\n", status, p.Head.SHA, p.Base.SHA, hash, len(r.CompletedUnits), len(r.PlannedUnits), len(r.Findings))
	for _, f := range r.Findings {
		fmt.Fprintf(&b, "\n- %s / %s: %s (%s:%d)\n%s\n", f.Severity, safeText(f.CriterionID), safeText(f.Title), safeText(f.Path), f.StartLine, safeText(f.Explanation))
	}
	for _, reason := range d.Reasons {
		fmt.Fprintf(&b, "\nGate: %s\n", safeText(reason))
	}
	text := b.String()
	if len(text) > 55000 {
		text = text[:54000] + "\nOutput truncated; full findings remain in the private S3 report. Gate includes all findings."
	}
	return strings.ToValidUTF8(text, " ")
}

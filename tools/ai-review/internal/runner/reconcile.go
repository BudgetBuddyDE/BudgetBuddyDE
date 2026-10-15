package runner

import (
	"context"
	"fmt"
	"os"
	"strconv"
)

// Reconcile scans open PRs rather than relying on merge-checkout resource state.
// Concourse must serialize this job, including manual builds.
func Reconcile(ctx context.Context) error {
	progress("reconcile_started", 0)
	// Environment validates the shared settings with a placeholder identity.
	if err := os.Setenv("REVIEW_PR", "1"); err != nil {
		return err
	}
	if err := os.Setenv("REVIEW_HEAD_SHA", "0000000000000000000000000000000000000000"); err != nil {
		return err
	}
	o, err := Environment()
	if err != nil {
		return err
	}
	jwt, err := appJWT(o.AppID, o.PrivateKey)
	if err != nil {
		return err
	}
	token, err := installationToken(ctx, jwt, o.InstallationID, o.Repository, false)
	if err != nil {
		return err
	}
	g := githubClient{httpClient(), token}
	var prs []struct {
		Number int `json:"number"`
		Head   struct {
			SHA string `json:"sha"`
		} `json:"head"`
		Base struct {
			Ref string `json:"ref"`
		} `json:"base"`
	}
	if err := g.call(ctx, "GET", "/repos/"+o.Repository+"/pulls?state=open&per_page=100", nil, &prs); err != nil {
		return err
	}
	if len(prs) >= 100 {
		return fmt.Errorf("reconcile requires fewer than 100 open PRs")
	}
	failed := false
	reviewed := 0
	progress("pull_requests_discovered", 0, "open", len(prs))
	for _, pr := range prs {
		if pr.Base.Ref != o.BaseBranch {
			continue
		}
		o.PR = pr.Number
		reviewed++
		o.ExpectedHead = pr.Head.SHA
		if err := Run(ctx, o); err != nil {
			fmt.Fprintln(os.Stderr, "PR "+strconv.Itoa(pr.Number)+": "+err.Error())
			failed = true
		}
	}
	progress("reconcile_completed", 0, "reviewed", reviewed, "has_failures", failed)
	if failed {
		return fmt.Errorf("one or more PR reviews failed")
	}
	return nil
}

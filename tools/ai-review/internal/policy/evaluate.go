// Package policy evaluates analysis results without delegating approval to a model.
package policy

import (
	"fmt"
	"strings"

	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/config"
	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/review"
)

// Evaluate is a local policy check. Snapshot evidence validation must precede
// any future GitHub publication; this function alone cannot attest code safety.
func Evaluate(cfg config.Config, report review.Report) review.Decision {
	d := review.Decision{Reasons: []string{}}
	if err := cfg.Validate(); err != nil {
		d.Reasons = append(d.Reasons, "invalid policy: "+err.Error())
		return d
	}
	if report.Version != 1 {
		d.Reasons = append(d.Reasons, "unsupported report version")
	}
	planned := map[string]bool{}
	for _, unit := range report.PlannedUnits {
		if strings.TrimSpace(unit) == "" || planned[unit] {
			d.Reasons = append(d.Reasons, "invalid or duplicate planned unit")
		}
		planned[unit] = true
	}
	if len(planned) == 0 {
		d.Reasons = append(d.Reasons, "no planned analysis units")
	}
	completed := map[string]bool{}
	for _, unit := range report.CompletedUnits {
		if !planned[unit] || completed[unit] {
			d.Reasons = append(d.Reasons, "unexpected or duplicate completed unit")
		}
		completed[unit] = true
	}
	for _, unit := range report.PlannedUnits {
		if !completed[unit] {
			d.Reasons = append(d.Reasons, "incomplete unit: "+unit)
		}
	}
	if len(report.Errors) > 0 {
		d.Reasons = append(d.Reasons, "analysis reported errors")
	}
	criteria := map[string]config.Criterion{}
	for _, c := range cfg.Criteria {
		criteria[c.ID] = c
	}
	for i, finding := range report.Findings {
		criterion, exists := criteria[finding.CriterionID]
		matches := false
		for _, pattern := range criterion.Paths {
			matches = matches || config.Matches(pattern, finding.Path)
		}
		if !exists || !matches || finding.Severity.Rank() == 0 || finding.StartLine < 1 || finding.EndLine < finding.StartLine || strings.TrimSpace(finding.Title) == "" || strings.TrimSpace(finding.Explanation) == "" || strings.TrimSpace(finding.Evidence) == "" {
			d.Reasons = append(d.Reasons, fmt.Sprintf("invalid finding %d", i))
			continue
		}
		if finding.Severity.Rank() >= criterion.BlockingFrom.Rank() {
			d.Reasons = append(d.Reasons, fmt.Sprintf("blocking finding %d (%s)", i, finding.CriterionID))
		}
	}
	d.Allowed = len(d.Reasons) == 0
	return d
}

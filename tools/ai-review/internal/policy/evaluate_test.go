package policy

import (
	"testing"

	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/config"
	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/review"
)

func TestEvaluate(t *testing.T) {
	p, err := config.Load("../../../../.ai-review")
	if err != nil {
		t.Fatal(err)
	}
	finding := review.Finding{CriterionID: "correctness", Severity: review.High, Path: "src/test.ts", StartLine: 1, EndLine: 1, Title: "Bug", Explanation: "Impact", Evidence: "source"}
	tests := []struct {
		name    string
		mutate  func(*review.Report)
		allowed bool
	}{
		{"complete", func(r *review.Report) {}, true},
		{"blocking", func(r *review.Report) { r.Findings = []review.Finding{finding} }, false},
		{"informational", func(r *review.Report) { f := finding; f.Severity = review.Medium; r.Findings = []review.Finding{f} }, true},
		{"incomplete", func(r *review.Report) { r.CompletedUnits = nil }, false},
		{"empty plan", func(r *review.Report) { r.PlannedUnits = nil; r.CompletedUnits = nil }, false},
		{"provider error", func(r *review.Report) { r.Errors = []string{"timeout"} }, false},
		{"unknown criterion", func(r *review.Report) { f := finding; f.CriterionID = "approve"; r.Findings = []review.Finding{f} }, false},
		{"unknown severity", func(r *review.Report) { f := finding; f.Severity = "safe"; r.Findings = []review.Finding{f} }, false},
		{"outside scope", func(r *review.Report) { f := finding; f.CriterionID = "security"; r.Findings = []review.Finding{f} }, false},
		{"unexpected unit", func(r *review.Report) { r.CompletedUnits = append(r.CompletedUnits, "other") }, false},
		{"unknown version", func(r *review.Report) { r.Version = 2 }, false},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r := review.Report{Version: 1, PlannedUnits: []string{"unit"}, CompletedUnits: []string{"unit"}}
			tc.mutate(&r)
			if d := Evaluate(p.Config, r); d.Allowed != tc.allowed {
				t.Fatalf("unexpected decision: %+v", d)
			}
		})
	}
}

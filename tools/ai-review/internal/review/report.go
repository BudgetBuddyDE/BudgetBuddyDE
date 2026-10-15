// Package review defines the versioned boundary between analysis and policy.
package review

type Severity string

const (
	Low      Severity = "low"
	Medium   Severity = "medium"
	High     Severity = "high"
	Critical Severity = "critical"
)

func (s Severity) Rank() int {
	switch s {
	case Low:
		return 1
	case Medium:
		return 2
	case High:
		return 3
	case Critical:
		return 4
	default:
		return 0
	}
}

type Finding struct {
	CriterionID string   `json:"criterionId"`
	Severity    Severity `json:"severity"`
	Path        string   `json:"path"`
	StartLine   int      `json:"startLine"`
	EndLine     int      `json:"endLine"`
	Title       string   `json:"title"`
	Explanation string   `json:"explanation"`
	Evidence    string   `json:"evidence"`
	Side        string   `json:"side"`
	Replacement *string  `json:"replacement"`
}

// Report is local analyzer input, not an authenticated attestation. A future
// publisher must verify snapshot references before trusting its findings.
type Report struct {
	Version        int       `json:"version"`
	PlannedUnits   []string  `json:"plannedUnits"`
	CompletedUnits []string  `json:"completedUnits"`
	Errors         []string  `json:"errors"`
	Findings       []Finding `json:"findings"`
}

type Decision struct {
	Allowed bool     `json:"allowed"`
	Reasons []string `json:"reasons"`
}

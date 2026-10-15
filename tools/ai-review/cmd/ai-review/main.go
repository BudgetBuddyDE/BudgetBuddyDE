package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/config"
	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/policy"
	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/review"
	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/runner"
)

func run(args []string, out io.Writer) error {
	if len(args) == 1 && args[0] == "reconcile" {
		return runner.Reconcile(context.Background())
	}
	if len(args) == 1 && args[0] == "run" {
		options, err := runner.Environment()
		if err != nil {
			return err
		}
		return runner.Run(context.Background(), options)
	}
	if len(args) == 3 && args[0] == "config" && args[1] == "validate" {
		p, err := config.Load(args[2])
		if err != nil {
			return err
		}
		return json.NewEncoder(out).Encode(map[string]string{"policyHash": p.Hash})
	}
	if len(args) == 3 && args[0] == "evaluate" {
		p, err := config.Load(args[1])
		if err != nil {
			return err
		}
		f, err := os.Open(args[2])
		if err != nil {
			return err
		}
		defer f.Close()
		data, err := io.ReadAll(io.LimitReader(f, 4*1024*1024+1))
		if err != nil {
			return err
		}
		if len(data) > 4*1024*1024 {
			return fmt.Errorf("report exceeds size limit")
		}
		var report review.Report
		if err := decode(data, &report); err != nil {
			return err
		}
		d := policy.Evaluate(p.Config, report)
		if err := json.NewEncoder(out).Encode(d); err != nil {
			return err
		}
		if !d.Allowed {
			return fmt.Errorf("local policy rejected report")
		}
		return nil
	}
	return fmt.Errorf("usage: ai-review config validate <trusted-policy-dir> | evaluate <trusted-policy-dir> <report.json>")
}

func main() {
	if err := run(os.Args[1:], os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

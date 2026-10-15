package runner

import "log/slog"

// Log only operational metadata, never source, prompts, credentials or model text.
func progress(ctxStage string, pr int, attributes ...any) {
	fields := []any{"stage", ctxStage}
	if pr > 0 {
		fields = append(fields, "pr", pr)
	}
	slog.Info("AI review", append(fields, attributes...)...)
}

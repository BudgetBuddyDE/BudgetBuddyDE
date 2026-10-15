package runner

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"testing"
)

func TestProgress(t *testing.T) {
	var output bytes.Buffer
	previous := slog.Default()
	slog.SetDefault(slog.New(slog.NewJSONHandler(&output, nil)))
	t.Cleanup(func() { slog.SetDefault(previous) })
	progress("snapshot_ready", 266, "files", 1)
	var event map[string]any
	if err := json.Unmarshal(output.Bytes(), &event); err != nil {
		t.Fatal(err)
	}
	if event["stage"] != "snapshot_ready" || event["pr"] != float64(266) || event["files"] != float64(1) {
		t.Fatalf("unexpected progress event: %v", event)
	}
}

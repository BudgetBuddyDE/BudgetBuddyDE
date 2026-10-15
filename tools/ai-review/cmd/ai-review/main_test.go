package main

import "testing"

func TestStrictDecoding(t *testing.T) {
	for _, input := range []string{`{"approved":true}`, `{} {}`, `null true`} {
		var result struct {
			Version int `json:"version"`
		}
		if err := decode([]byte(input), &result); err == nil {
			t.Fatalf("accepted %s", input)
		}
	}
}

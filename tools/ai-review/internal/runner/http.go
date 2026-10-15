// Package runner implements the bounded, tool-free review workflow.
package runner

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const maxResponse = 8 << 20

type githubClient struct {
	client *http.Client
	token  string
}

func httpClient() *http.Client {
	return &http.Client{Timeout: 60 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return fmt.Errorf("redirects forbidden") }}
}

func request(ctx context.Context, client *http.Client, method, endpoint, token string, body, result any) error {
	var input io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		input = bytes.NewReader(b)
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint, input)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/vnd.github+json")
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("HTTP transport failed")
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(io.LimitReader(resp.Body, maxResponse+1))
	if err != nil || len(b) > maxResponse {
		return fmt.Errorf("HTTP response unreadable or oversized")
	}
	// Never echo provider/GitHub error bodies: they can contain source or credentials.
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("HTTP status %d", resp.StatusCode)
	}
	if result == nil {
		return nil
	}
	return json.Unmarshal(b, result)
}

func (g githubClient) call(ctx context.Context, method, path string, body, result any) error {
	return request(ctx, g.client, method, "https://api.github.com"+path, g.token, body, result)
}

func appJWT(id, keyPEM string) (string, error) {
	block, _ := pem.Decode([]byte(keyPEM))
	if block == nil {
		return "", fmt.Errorf("invalid app private key PEM")
	}
	var key *rsa.PrivateKey
	if k, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		key = k
	} else {
		parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return "", fmt.Errorf("invalid app private key")
		}
		var ok bool
		key, ok = parsed.(*rsa.PrivateKey)
		if !ok {
			return "", fmt.Errorf("RSA key required")
		}
	}
	now := time.Now().Unix()
	payload, _ := json.Marshal(map[string]any{"iat": now - 60, "exp": now + 540, "iss": id})
	unsigned := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"RS256","typ":"JWT"}`)) + "." + base64.RawURLEncoding.EncodeToString(payload)
	digest := sha256.Sum256([]byte(unsigned))
	signature, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, digest[:])
	if err != nil {
		return "", err
	}
	return unsigned + "." + base64.RawURLEncoding.EncodeToString(signature), nil
}

func installationToken(ctx context.Context, jwt, installation, repo string, write bool) (string, error) {
	permissions := map[string]string{"contents": "read", "pull_requests": "read"}
	if write {
		permissions["pull_requests"] = "write"
		permissions["checks"] = "write"
	}
	var result struct {
		Token string `json:"token"`
	}
	g := githubClient{httpClient(), jwt}
	err := g.call(ctx, "POST", "/app/installations/"+installation+"/access_tokens", map[string]any{"repositories": []string{strings.Split(repo, "/")[1]}, "permissions": permissions}, &result)
	if err != nil {
		return "", err
	}
	if result.Token == "" {
		return "", fmt.Errorf("empty installation token")
	}
	return result.Token, nil
}

func escapePath(path string) string {
	parts := strings.Split(path, "/")
	for i := range parts {
		parts[i] = url.PathEscape(parts[i])
	}
	return strings.Join(parts, "/")
}

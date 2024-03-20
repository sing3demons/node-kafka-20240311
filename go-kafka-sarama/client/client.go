package client

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
)

func makeRequest(method, url string, payload io.Reader) ([]byte, error) {
	timeoutStr := os.Getenv("TIMEOUT")
	var timeout time.Duration
	timeout, err := time.ParseDuration(timeoutStr)
	if err != nil {
		timeout = 10 * time.Second
	}

	httpClient := &http.Client{
		Timeout: timeout,
	}
	req, err := http.NewRequest(method, url, payload)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-session", "go-service::"+uuid.New().String())

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	return body, err
}

func HttpClientGet[T any](url string) (T, error) {
	var response T
	body, err := makeRequest(http.MethodGet, url, nil)
	if err != nil {
		return response, err
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return response, err
	}

	return response, nil
}

func HttpClientPost[T any](url string, payload any) (T, error) {
	var response T

	payloadData, err := json.Marshal(payload)
	if err != nil {
		return response, err
	}
	body, err := makeRequest(http.MethodPost, url, bytes.NewReader(payloadData))
	if err != nil {
		return response, err
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return response, err
	}

	return response, nil
}

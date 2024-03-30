package main

import "time"

type Header map[string]string

type Message struct {
	Partition int32     `json:"partition,omitempty"`
	Offset    int64     `json:"offset,omitempty"`
	Key       string    `json:"key,omitempty"`
	Value     string    `json:"value,omitempty"`
	Timestamp time.Time `json:"@timestamp,omitempty"`
	Headers   Header    `json:"headers,omitempty"`
	Topic     string    `json:"topic,omitempty"`
	SessionID string    `json:"session_id,omitempty"`
	ID        int32     `json:"id,omitempty"`
}

type Project struct {
	Title       string `json:"title,omitempty"`
	Category    string `json:"category,omitempty"`
	Description string `json:"description,omitempty"`
}

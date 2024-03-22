package main

import (
	"context"
	"encoding/json"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/mongo"
)

type TodoHandler struct {
	db  *mongo.Client
	log *logrus.Logger
}

func NewTodoHandler(db *mongo.Client, log *logrus.Logger) *TodoHandler {
	return &TodoHandler{db: db, log: log}
}

func (h *TodoHandler) handlerTodoCreate(data Message) {
	col := h.db.Database("todo").Collection("todo")
	result := Project{}
	json.Unmarshal([]byte(data.Value), &result)
	insertOneResult, err := col.InsertOne(context.Background(), result)
	logger.WithFields(logrus.Fields{
		"partition":  data.Partition,
		"offset":     data.Offset,
		"key":        data.Key,
		"value":      data.Value,
		"timestamp":  data.Timestamp,
		"headers":    data.Headers,
		"topic":      data.Topic,
		"session_id": data.SessionID,
		"id":         data.ID,
		"result":     insertOneResult,
		"error":      err,
	}).Info("topic: ", data.Topic)
}

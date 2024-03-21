package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/IBM/sarama"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

const (
	assignor = "sticky"
	oldest   = true
	verbose  = false
	group    = "kafka-for-dev"
	version  = "1.0.0"
)

var logger *logrus.Logger

func init() {
	logger = logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetOutput(os.Stdout)
	logger.SetLevel(logrus.InfoLevel)
}

func ConnectMonoDB() (*mongo.Client, error) {
	uri := os.Getenv("MONGO_URL")
	if uri == "" {
		uri = "mongodb://mongo1:30001,mongo2:30002,mongo3:30003/dev_products?replicaSet=my-replica-set"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, err
	}
	return client, nil
}

func main() {
	keepRunning := true

	hostName, err := os.Hostname()
	logger.WithFields(logrus.Fields{
		"group":    group,
		"assignor": assignor,
		"oldest":   oldest,
		"verbose":  verbose,
		"version":  version,
		"hostName": hostName,
		"pid":      os.Getpid(),
		"ppid":     os.Getppid(),
		"uid":      os.Getuid(),
		"gid":      os.Getgid(),
		"error":    err,
	}).Info("Starting a new Sarama consumer")

	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		brokers = "localhost:9092"
	}
	topics := os.Getenv("KAFKA_TOPICS")
	if topics == "" {
		topics = "test.createTodo"
	}

	if verbose {
		sarama.Logger = logger
	}

	version, err := sarama.ParseKafkaVersion(version)
	if err != nil {
		logger.Panicf("Error parsing Kafka version: %v", err)
	}

	/**
	 * Construct a new Sarama configuration.
	 * The Kafka cluster version has to be defined before the consumer/producer is initialized.
	 */
	config := sarama.NewConfig()
	config.Version = version

	switch assignor {
	case "sticky":
		config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRange()
	case "roundrobin":
		config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRange()
	case "range":
		config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRange()
	default:
		logger.Panicf("Unrecognized consumer group partition assignor: %s", assignor)
	}

	if oldest {
		config.Consumer.Offsets.Initial = sarama.OffsetOldest
	}

	/**
	 * Setup a new Sarama consumer group
	 */
	consumer := Consumer{
		ready: make(chan bool),
	}

	fmt.Println("brokers: ", brokers)

	ctx, cancel := context.WithCancel(context.Background())
	client, err := sarama.NewConsumerGroup(strings.Split(brokers, ","), group, config)
	if err != nil {
		logger.Panicf("Error creating consumer group client: %v", err)
	}

	consumptionIsPaused := false
	wg := &sync.WaitGroup{}
	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			// `Consume` should be called inside an infinite loop, when a
			// server-side rebalance happens, the consumer session will need to be
			// recreated to get the new claims
			if err := client.Consume(ctx, strings.Split(topics, ","), &consumer); err != nil {
				logger.Panicf("Error from consumer: %v", err)
			}
			// check if context was cancelled, signaling that the consumer should stop
			if ctx.Err() != nil {
				return
			}
			consumer.ready = make(chan bool)
		}
	}()

	<-consumer.ready // Await till the consumer has been set up
	logger.Info("Sarama consumer up and running!...")

	sigusr1 := make(chan os.Signal, 1)
	signal.Notify(sigusr1, syscall.SIGUSR1)

	sigterm := make(chan os.Signal, 1)
	signal.Notify(sigterm, syscall.SIGINT, syscall.SIGTERM)

	for keepRunning {
		select {
		case <-ctx.Done():
			logger.Info("terminating: context cancelled")
			keepRunning = false
		case <-sigterm:
			logger.Info("terminating: via signal")
			keepRunning = false
			case <-sigusr1:
				toggleConsumptionFlow(client, &consumptionIsPaused)
		}
	}
	cancel()
	wg.Wait()
	if err = client.Close(); err != nil {
		logger.Panicf("Error closing client: %v", err)
	}

}

func toggleConsumptionFlow(client sarama.ConsumerGroup, isPaused *bool) {
	if *isPaused {
		client.ResumeAll()
		log.Println("Resuming consumption")
	} else {
		client.PauseAll()
		log.Println("Pausing consumption")
	}

	*isPaused = !*isPaused
}

// Consumer represents a Sarama consumer group consumer
type Consumer struct {
	ready chan bool
}

// Setup is run at the beginning of a new session, before ConsumeClaim
func (consumer *Consumer) Setup(sarama.ConsumerGroupSession) error {
	// Mark the consumer as ready
	close(consumer.ready)
	return nil
}

// Cleanup is run at the end of a session, once all ConsumeClaim goroutines have exited
func (consumer *Consumer) Cleanup(sarama.ConsumerGroupSession) error {
	return nil
}

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

// ConsumeClaim must start a consumer loop of ConsumerGroupClaim's Messages().
func (consumer *Consumer) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	db, _ := ConnectMonoDB()
	col := db.Database("todo").Collection("todo")
	// NOTE:
	// Do not move the code below to a goroutine.
	// The `ConsumeClaim` itself is called within a goroutine, see:
	// https://github.com/Shopify/sarama/blob/main/consumer_group.go#L27-L29
	for message := range claim.Messages() {

		sessionId := strings.TrimPrefix(session.MemberID(), "sarama-")
		id := session.GenerationID()
		headers := make(Header)
		for _, header := range message.Headers {
			key := string(header.Key)
			value := string(header.Value)
			if key != "" && value != "" {
				headers[key] = value
			}
		}

		data := Message{
			Partition: message.Partition,
			Offset:    message.Offset,
			Key:       string(message.Key),
			Value:     string(message.Value),
			Timestamp: message.Timestamp,
			Headers:   headers,
			Topic:     message.Topic,
			SessionID: sessionId,
			ID:        id,
		}

		var insertOneResult *mongo.InsertOneResult
		var err error
		switch message.Topic {
		case "test.createTodo":
			result := Project{}
			json.Unmarshal([]byte(data.Value), &result)
			insertOneResult, err = col.InsertOne(context.Background(), result)

		default:
			logger.Info("topic: "+message.Topic, " not found")
		}

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
		}).Info("topic: ", message.Topic)

		session.MarkMessage(message, "")
	}

	return nil
}

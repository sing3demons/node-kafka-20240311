package producer

import (
	"encoding/json"
	"fmt"

	"github.com/IBM/sarama"
)

func PushProjectToTopic(topic string, message []byte) error {
	brokersUrl := []string{"localhost:9092"}

	producer, err := ConnectProducer(brokersUrl)
	if err != nil {
		return err
	}

	defer producer.Close()

	msg := &sarama.ProducerMessage{
		Topic: topic,
		Value: sarama.StringEncoder(message),
	}

	_, _, err = producer.SendMessage(msg)
	if err != nil {
		return err
	}

	// fmt.Printf("Message is stored in topic(%s)/partition(%d)/offset(%d)\n", topic, partition, offset)
	defer producer.Close()

	return nil
}

func PushDataToTopic[T any](topic string, messages []T) error {
	brokersUrl := []string{"localhost:9092"}

	producer, err := ConnectProducer(brokersUrl)
	if err != nil {
		return err
	}

	defer producer.Close()

	var msgs []*sarama.ProducerMessage

	for _, message := range messages {
		jsonMessage, _ := json.Marshal(message)
		msg := &sarama.ProducerMessage{
			Topic: topic,
			Value: sarama.StringEncoder(jsonMessage),
		}
		msgs = append(msgs, msg)
	}

	fmt.Println("Messages: ", len(msgs))

	if err := producer.SendMessages(msgs); err != nil {
		return err
	}

	return nil
}

func ConnectProducer(brokersUrl []string) (sarama.SyncProducer, error) {
	config := sarama.NewConfig()
	config.Producer.Return.Successes = true
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 3

	conn, err := sarama.NewSyncProducer(brokersUrl, config)
	if err != nil {
		return nil, err
	}

	return conn, nil
}

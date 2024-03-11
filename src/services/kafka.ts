import { Kafka, Message, Logger, Admin } from 'kafkajs'

type MessageCallback = (topic: string, message: string | undefined) => void;
export class KafkaService {
  private kafka: Kafka
  private logger: Logger
  private admin: Admin

  constructor() {
    this.kafka = new Kafka({
      clientId: 'my-app',
      brokers: ['localhost:9092'],
    })
    this.logger = this.kafka.logger()
    this.admin = this.kafka.admin()
  }


  async sendMessage(topic: string, message: Array<Object> | Object | string) {
    let messages: Message[] = []
    if (typeof message === 'object') {
      if (Array.isArray(message)) {
        message.forEach((msg) => {
          messages.push({ value: JSON.stringify(msg) })
        })
      } else {
        messages.push({ value: JSON.stringify(message) })
      }
    } else {
      messages.push({ value: message })
    }

    const producer = this.kafka.producer()
    await producer.connect()
    const record = await producer.send({ topic, messages })

    this.logger.info(`Sent successfully ${record}`)
    await producer.disconnect()
    return record
  }

  async consumeMessages(topic: string, callback: MessageCallback ) {
    const consumer = this.kafka.consumer({ groupId: 'test-group' })
    await consumer.connect()
    await consumer.subscribe({ topics: topic.split(','), fromBeginning: true })

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        this.logger.info('received message', {
          topic,
          partition,
          offset: message.offset,
          value: message.value?.toString(),
        })
        callback(topic, message?.value?.toString())
      },
    })
  }
}

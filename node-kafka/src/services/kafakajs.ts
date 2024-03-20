import { Kafka, Message } from 'kafkajs'

const kafka = new Kafka({
  brokers: ['localhost:9092'],
})

const admin = kafka.admin()
const producer = kafka.producer()

async function consumeMessages() {
  try {
    const consumer = kafka.consumer({ groupId: 'test-group' })
    await consumer.connect()
    const topics = process.env?.KAFKA_TOPICS?.split(',')
    if (!topics) {
      throw new Error('KAFKA_TOPICS is not defined')
    }

    await consumer.subscribe({ topics, fromBeginning: true })

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {},
    })
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
  }
}

async function sendMessage(topic: string, message: Array<Object> | Object | string) {
  try {
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

    await producer.connect()
    const record = await producer.send({ topic, messages })

    await producer.disconnect()
    return record
  } catch (error) {}
}

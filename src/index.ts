import express from 'express'
import { KafkaService } from './services/kafka'
import { TodoController } from './controller/todo'

const port = process.env?.PORT || 3000

async function main() {
  const app = express()
  const kafkaService = new KafkaService()
  const todoController = new TodoController(kafkaService)
  app.use(express.json())

  app.post('/todo', todoController.createTodo)

  await kafkaService
    .consumeMessages('test', testConsumer)
    .then(() => console.log('Listening for messages...'))
    .catch((error) => console.error('Error starting consumer:', error))

  app.listen(port, async () => {
    console.log('Server is running on port ', port)
  })

  process.on('SIGINT', async () => {
    console.log('Shutting down')
    process.exit(0)
  })
}

main().catch(console.error)

function testConsumer(topic: string, message: string | undefined) {
  console.log('=====================================?')
  console.log(`Received message from topic: ${topic} and message: ${message}`)

  switch (topic) {
    case 'test':
      console.log('Do something with the message')
      break
    case 'test2':
      console.log('Do something else with the message')
      break
    default:
      break
  }
}

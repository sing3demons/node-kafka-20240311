import express from 'express'
import { KafkaService } from './services/kafka'
import { TodoController } from './controller/todo'

async function main() {
  const app = express()
  const kafkaService = new KafkaService()
  const todoController = new TodoController(kafkaService)

  app.get('/', todoController.createTodo)

  app.listen(3000, () => {
    kafkaService.consumeMessages('test', testConsumer)
    console.log('Server is running on port 3000')
  })

  process.on('SIGINT', async () => {
    console.log('Shutting down')
    process.exit(0)
  })
}

main().catch(console.error)

function testConsumer (topic: string, message: string | undefined)  {
  console.log('=====================================?')
  console.log(`Received message from topic: ${topic} and message: ${message}`)
}


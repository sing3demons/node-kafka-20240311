import express from 'express'
import { KafkaService } from './services/kafka'
import { TodoController } from './controller/todo'
import { connectToCluster } from './db'
import { MongoClient } from 'mongodb'
import { ServiceManager } from './services/serviceManager'
import { debug } from 'console'

const port = process.env?.PORT ?? 3000

async function main() {
  const client: MongoClient = await connectToCluster()
  const app = express()
  const kafkaService = new KafkaService()
  const serviceManager = new ServiceManager(client)
  const todoController = new TodoController(kafkaService, client)
  app.use(express.json())

  app.get('/todo', todoController.getTodos)
  app.post('/todo', todoController.createTodo)
  app.delete('/todo/:id', todoController.deleteTodo)

  await kafkaService
    .consumeMessages('test.createTodo', serviceManager.consumer)
    .then(() => console.log('Listening for messages...'))
    .catch((error) => console.error('Error starting consumer:', error))

  const server = app.listen(port, () => console.log('Server is running on port ', port))

  process.on('SIGINT', async () => {
    debug('SIGINT signal received: closing HTTP server')
    server.close(() => {
      debug('HTTP server closed')
    })
  })

  process.on('SIGTERM', () => {
    debug('SIGTERM signal received: closing HTTP server')
    server.close(() => {
      debug('HTTP server closed')
    })
  })
}

main().catch(console.error)

async function testConsumer(topic: string, message: string | undefined) {
  console.log('=====================================?')
  console.log(`Received message from topic: ${topic} and message: ${message}`)

  switch (topic) {
    case 'test.createTodo':
      console.log('Do something with the message')
      const data = JSON.parse(message as string)
      // const result = await client.db('todo').collection('todo').insertOne({ ...data })
      console.log(data)
      break
    case 'test2':
      console.log('Do something else with the message')
      break
    default:
      break
  }
}

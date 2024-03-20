import express from 'express'
import { KafkaService } from './services/kafka'
import { MongoService } from './db'
import { ServiceManager } from './services/serviceManager'
import { debug } from 'console'
import TodoRouter from './routes/todo'

const port = process.env?.PORT ?? 3000
const mongoClient = new MongoService()
const kafkaService = new KafkaService()

const apiServer = {
  async start(port: string | number) {
    await mongoClient.connect()
    const client = mongoClient.getClient()
    const serviceManager = new ServiceManager(client)

    const app = express()
    app.use(express.json())

    new TodoRouter(kafkaService, client).register(app)

    await kafkaService
      .consumeMessages('test.createTodo', serviceManager.consumer)
      .then(() => console.log('Listening for messages...'))
      .catch((error) => console.error('Error starting consumer:', error))

    const server = app.listen(port)

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server')
      server.close(() => {
        console.log('HTTP server closed')
      })
    })

    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server')
      server.close(() => {
        console.log('HTTP server closed')
      })
    })
  },
}

apiServer
  .start(port)
  .then(() => console.log('Listening for messages...'))
  .catch((error) => console.error('Error starting consumer:', error))

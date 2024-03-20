import express from 'express'
import { KafkaService } from './services/kafka'
import { MongoService } from './db'
import { ServiceManager } from './services/serviceManager'
import TodoRouter from './routes/todo'
import Logger from './logger'

const port = process.env?.PORT ?? 3000
const mongoClient = new MongoService()
const kafkaService = new KafkaService()
const logger = new Logger('api-server')

const apiServer = {
  async start(port: string | number) {
    await mongoClient.connect()
    const client = mongoClient.getClient()
    const serviceManager = new ServiceManager(client, logger)

    const app = express()
    app.use(express.json())

    new TodoRouter(kafkaService, client, logger).register(app)

    await kafkaService
      .consumeMessages('test.createTodo', serviceManager.consumer)
      .then(() => logger.info('Listening for messages...'))
      .catch((error) => logger.error('Error starting consumer:', error))

    const server = app.listen(port)

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server')
      // await mongoClient.close()
      server.close(() => {
        logger.info('HTTP server closed')
      })
    })

    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server')
      // await mongoClient.close()
      server.close(() => {
        logger.info('HTTP server closed')
      })
    })
  },
}

apiServer
  .start(port)
  .then(() => logger.info(`Server running on port ${port}`))
  .catch((error) => logger.error('Error starting consumer:', error))

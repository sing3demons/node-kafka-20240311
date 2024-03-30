import express from 'express'
import { KafkaService } from './services/kafka'
import { MongoService } from './db'
import { ServiceManager } from './services/serviceManager'
import TodoRouter from './routes/todo'
import Logger from './logger'
import { v4 as uuidv4 } from 'uuid'
import Context from './context/context'

const port = process.env?.PORT ?? 3000
const mongoClient = new MongoService()
const kafkaService = new KafkaService()
const logger = new Logger('api-server')

const apiServer = {
  async start(port: string | number) {
    await mongoClient.connect()
    const client = mongoClient.getClient()
    // const serviceManager = new ServiceManager(client, logger)

    const app = express()
    app.use(express.json())
    app.use((req, res, next) => {
      if (!req.headers['x-session']) {
        req.headers['x-session'] = 'unknown-' + uuidv4()
      }
      Context.bind(req)
      next()
    })

    new TodoRouter(kafkaService, client, logger).register(app)

    // await kafkaService
    //   .consumeMessages('app.createTodo', serviceManager.consumer)
    //   .then(() => logger.info('Listening for messages...'))
    //   .catch((error) => logger.error('Error starting consumer:', error))

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

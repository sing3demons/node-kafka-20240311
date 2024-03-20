import { MongoClient } from 'mongodb'
import Logger from '../logger'

export class ServiceManager {
  constructor(
    private readonly client: MongoClient,
    private readonly logger: Logger,
  ) {}

  consumer = async (topic: string, message: string) => {
    try {
      switch (topic) {
        case 'test.createTodo':
          const dbName = 'todo'
          const data = JSON.parse(message)
          const result = await this.client
            .db(dbName)
            .collection(dbName)
            .insertOne({ ...data })
          this.logger.info('Inserted todo', {
            topic,
            message,
            ...result,
          })
          break
        case 'test2':
          console.log('Do something else with the message')
          break
        default:
          break
      }
    } catch (error) {}
  }
}

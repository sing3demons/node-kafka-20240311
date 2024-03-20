import { MongoClient } from 'mongodb'

export class ServiceManager {
  constructor(private readonly client: MongoClient) {}

  consumer = async (topic: string, message: string) => {
    try {
      console.log('=====================================>')
      console.log(`Received message from topic: ${topic} and message: ${message}`)

      switch (topic) {
        case 'test.createTodo':
          const data = JSON.parse(message)
          const result = await this.client
            .db('todo')
            .collection('todo')
            .insertOne({ ...data })
          console.log(result)
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

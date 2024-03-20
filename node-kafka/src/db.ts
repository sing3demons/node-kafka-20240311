import { MongoClient } from 'mongodb'
const uri =
  process.env?.MONGO_URI ?? 'mongodb://mongo1:30001,mongo2:30002,mongo3:30003/dev_products?replicaSet=my-replica-set'


export class MongoService {
  private client: MongoClient
  constructor() {
    this.client = new MongoClient(uri)
  }

  async connect() {
    try {
      console.log('Connecting to MongoDB...')
      await this.client.connect()
      console.log('Successfully connected to MongoDB Atlas!')
    } catch (error) {
      console.error('Connection to MongoDB Atlas failed!', error)
      process.exit()
    }
  }

  async close() {
    await this.client.close()
  }

  getClient() {
    return this.client
  }
}

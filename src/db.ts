import { MongoClient } from 'mongodb'
const uri =
  process.env?.MONGO_URI ?? 'mongodb://mongo1:30001,mongo2:30002,mongo3:30003/dev_products?replicaSet=my-replica-set'

async function connectToCluster() {
  try {
    const mongoClient = new MongoClient(uri)
    console.log('Connecting to MongoDB Atlas cluster...')
    await mongoClient.connect()
    console.log('Successfully connected to MongoDB Atlas!')

    return mongoClient
  } catch (error) {
    console.error('Connection to MongoDB Atlas failed!', error)
    process.exit()
  }
}

export class MongoService {
  private client: MongoClient
  constructor() {
    this.client = new MongoClient(uri)
  }

  async connect() {
    try {
      console.log('Connecting to MongoDB Atlas cluster...')
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

import { MongoClient } from 'mongodb'
const uri =
  process.env?.MONGO_URI ??
  'mongodb://mongo1:30001,mongo2:30002,mongo3:30003/dev_products?replicaSet=my-replica-set'


export async function connectToCluster() {
  let mongoClient

  try {
    mongoClient = new MongoClient(uri)
    console.log('Connecting to MongoDB Atlas cluster...')
    await mongoClient.connect()
    console.log('Successfully connected to MongoDB Atlas!')

    return mongoClient
  } catch (error) {
    console.error('Connection to MongoDB Atlas failed!', error)
    process.exit()
  }
}

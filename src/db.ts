import { MongoClient } from 'mongodb'
const uri =
  process.env?.MONGO_URI ??
  'mongodb://root:example@localhost:27017?authSource=admin'


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

import { MongoClient, ObjectId } from 'mongodb'
import Logger, { ILogger } from '../logger'
import { ContextType } from '../context/context'

export default class TodoRepository {
  private readonly dbName = 'todo'
  private readonly collectionName = 'todo'
  constructor(
    private readonly client: MongoClient,
    private readonly logger: Logger,
  ) {}

  findAll = async ({ limit, skip }: Record<string, number>, ctx?: ContextType) => {
    this.logger.info('db ', { limit, skip, dbName: this.dbName, collectionName: this.collectionName }, ctx)
    try {
      return await this.client.db(this.dbName).collection(this.collectionName).find().limit(limit).skip(skip).toArray()
    } catch (error) {
      throw error
    }
  }

  findOne = async (id: string) => {
    try {
      return await this.client
        .db('todo')
        .collection('todo')
        .findOne({ _id: new ObjectId(id) })
    } catch (error) {
      throw error
    }
  }

  delete = async (id: string) => {
    try {
      return await this.client
        .db('todo')
        .collection('todo')
        .deleteOne({ _id: new ObjectId(id) })
    } catch (error) {
      throw error
    }
  }
}

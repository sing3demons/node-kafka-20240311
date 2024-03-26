import { Request, Response } from 'express'
import { KafkaService, getHeaders } from '../services/kafka'
import { MongoClient, ObjectId } from 'mongodb'
import Logger from '../logger'
import log, { NewLogger } from '../logger/winston'
import TodoRepository from '../repository/todo'

export class TodoController {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly logger: Logger,
    private readonly todoRepository: TodoRepository,
  ) {}

  createTodo = async (req: Request, res: Response) => {
    const logger = this.logger.Logger(req)
    logger.info('Create todo', req.body)
    try {
      const record = await this.kafkaService.sendMessage('app.createTodo', req.body, getHeaders(req))
      return res.json(record)
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message })
      }
    }
  }

  getTodoList = async (req: Request, res: Response) => {
    // const logger = NewLogger(req)
    const logger = this.logger.Logger(req)
    logger.info('Get todo list', req.query)
    try {
      const size = (req.query?.size as string) ?? '100'
      const page = (req.query?.page as string) ?? '1'
      // improve this to use pagination
      const limit = parseInt(size) ?? 100
      const skip = (parseInt(page) - 1) * limit
      const data = await this.todoRepository.findAll({ limit, skip }, req.header('x-session'))

      // const [data, count] = await Promise.all([col.find().limit(limit).skip(skip).toArray(), col.countDocuments()])
      // this.logger.info('Get todo list', { data, count }, session)
      // return res.json({
      //   data: data,
      //   totalPages: Math.ceil(count / limit),
      //   currentPage: page,
      // })

      logger.info('response :: ', { data })
      return res.json(data)
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message })
      }
    }
  }

  getTodo = async (req: Request, res: Response) => {
    try {
      // const id = new ObjectId(req.params.id)
      // const todo = await this.client.db('todo').collection('todo').findOne({ _id: id })
      const todo = await this.todoRepository.findOne(req.params.id)
      return res.json(todo)
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message })
      }
    }
  }

  deleteTodo = async (req: Request, res: Response) => {
    try {
      // const id = new ObjectId(req.params.id)
      // const todo = await this.client.db('todo').collection('todo').deleteOne({ _id: id })
      const todo = await this.todoRepository.delete(req.params.id)
      return res.json(todo)
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message })
      }
    }
  }
}

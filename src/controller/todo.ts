import { Request, Response } from 'express'
import { KafkaService, getHeaders } from '../services/kafka'
import { MongoClient, ObjectId } from 'mongodb'

export class TodoController {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly client: MongoClient,
  ) {}

  createTodo = async (req: Request, res: Response) => {
    console.log('Creating todo')
    try {
      const record = await this.kafkaService.sendMessage('test.createTodo', req.body, getHeaders(req))
      return res.json(record)
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message })
      }
    }
  }

  getTodos = async (req: Request, res: Response) => {
    try {
      const todo = await this.client.db('todo').collection('todo').find().toArray()
      return res.json(todo)
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message })
      }
    }
  }

  getTodo = async (req: Request, res: Response) => {
    try {
      const id = new ObjectId(req.params.id); 
      const todo = await this.client.db('todo').collection('todo').findOne({ _id: id });
      return res.json(todo);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }
    }
  }

  deleteTodo = async (req: Request, res: Response) => {
    try {
      const id = new ObjectId(req.params.id); 
      const todo = await this.client.db('todo').collection('todo').deleteOne({ _id: id });
      return res.json(todo);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }
    }
  }
}

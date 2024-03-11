import { Request, Response } from 'express'
import { KafkaService } from '../services/kafka'

export class TodoController {
  constructor(private readonly kafkaService: KafkaService) {}

  createTodo = async (req: Request, res: Response) => {
    try {
      const record = await this.kafkaService.sendMessage('test', {
        name: 'test',
      })
      return res.json(record)
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message })
      }
    }
  }
}

import { TodoController } from '../controller/todo'
import { MongoClient } from 'mongodb'
import { KafkaService } from '../services/kafka'
import { Router } from 'express'

export default class TodoRouter {
  constructor(
    private kafkaService: KafkaService,
    private client: MongoClient,
  ) {}

  register(router: Router): Router {
    const todoController = new TodoController(this.kafkaService, this.client)
    router.get('/todo', todoController.getTodos)
    router.get('/todo/:id', todoController.getTodo)
    router.post('/todo', todoController.createTodo)
    router.delete('/todo/:id', todoController.deleteTodo)
    return router
  }
}

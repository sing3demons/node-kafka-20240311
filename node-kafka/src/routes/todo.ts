import { TodoController } from '../controller/todo'
import { MongoClient } from 'mongodb'
import { KafkaService } from '../services/kafka'
import { Router } from 'express'
import Logger from '../logger'
import TodoRepository from '../repository/todo'

export default class TodoRouter {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly client: MongoClient,
    private readonly logger: Logger,
  ) {}

  register(router: Router): Router {
    const todoRepository = new TodoRepository(this.client, this.logger)
    const todoController = new TodoController(this.kafkaService, this.logger, todoRepository)
    router.get('/todo', todoController.getTodoList)
    router.get('/todo/:id', todoController.getTodo)
    router.post('/todo', todoController.createTodo)
    router.delete('/todo/:id', todoController.deleteTodo)
    return router
  }
}

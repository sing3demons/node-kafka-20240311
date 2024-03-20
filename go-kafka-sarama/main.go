package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sing3demons/service-todo/handler"
)

// project struct

func main() {

	app := fiber.New()
	api := app.Group("/api/") // /api

	todo := handler.NewTodoHandler()

	api.Post("/todo", todo.CreateProject)
	api.Get("/todo", todo.GetTodoList)
	api.Get("/todo/:id", todo.GetTodo)

	app.Listen(":8080")
}

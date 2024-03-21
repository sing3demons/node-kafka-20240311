package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

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

	go func() {
		if err := app.Listen(":8080"); err != nil {
			log.Panic(err)
		}
	}()

	c := make(chan os.Signal, 1)                    // Create channel to signify a signal being sent
	signal.Notify(c, os.Interrupt, syscall.SIGTERM) // When an interrupt or termination signal is sent, notify the channel

	_ = <-c // This blocks the main thread until an interrupt is received
	fmt.Println("Gracefully shutting down...")
	_ = app.Shutdown()

	fmt.Println("Running cleanup tasks...")
	fmt.Println("Fiber was successful shutdown.")

}

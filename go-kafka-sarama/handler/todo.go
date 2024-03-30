package handler

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/bxcodec/faker/v4"

	"github.com/gofiber/fiber/v2"
	"github.com/sing3demons/service-todo/client"
	"github.com/sing3demons/service-todo/producer"
)

type todoHandler struct{}

type TodoHandler interface {
	CreateProject(c *fiber.Ctx) error
	GetTodo(c *fiber.Ctx) error
	GetTodoList(c *fiber.Ctx) error
}

func NewTodoHandler() TodoHandler {
	return &todoHandler{}
}

type Project struct {
	Id          string `json:"_id,omitempty" `
	Href        string `json:"href,omitempty"`
	Title       string `json:"title,omitempty"`
	Category    string `json:"category,omitempty"`
	Description string `json:"description,omitempty"`
}

type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"results,omitempty"`
}

type ResponseTodo struct {
	Data        []Project `json:"data"`
	TotalPages  int       `json:"totalPages,omitempty"`
	CurrentPage string    `json:"currentPage,omitempty"`
}

func (h *todoHandler) GetTodoList(c *fiber.Ctx) error {
	host := os.Getenv("SERVICE_TODO_HOST")
	if host == "" {
		host = "http://localhost:3000"
	}

	var todoList []Project
	size := c.Query("size")
	page := c.Query("page")

	var query string
	if size != "" && page != "" {
		query = fmt.Sprintf("?size=%s&page=%s", size, page)
	}

	data, err := client.HttpClientGet[[]Project](host + "/todo" + query)

	if err != nil {
		return c.JSON(Response{
			Status:  "error",
			Message: err.Error(),
			Data:    nil,
		})
	}

	todoList = make([]Project, 0, len(data))
	hostName := os.Getenv("SERVICE_HOST")
	if hostName == "" {
		hostName = "http://localhost:8080/api/todo/"
	}

	for _, project := range data {
		project.Href = hostName + project.Id
		todoList = append(todoList, project)
	}


	return c.JSON(Response{
		Status:  "success",
		Message: "todo list",
		Data:    todoList,
	})
}

func (h *todoHandler) GetTodo(c *fiber.Ctx) error {
	host := os.Getenv("SERVICE_TODO_HOST")
	if host == "" {
		host = "http://localhost:3000"
	}
	id := c.Params("id")

	project, err := client.HttpClientGet[Project](host + "/todo/" + id)

	if err != nil {
		return c.JSON(&Response{
			Status:  "error",
			Message: err.Error(),
			Data:    nil,
		})
	}
	hostName := os.Getenv("SERVICE_TODO_HOST")
	if hostName == "" {
		hostName = "http://localhost:8080/api/todo/"
	}

	project.Href = hostName + project.Id

	return c.JSON(&Response{
		Status:  "success",
		Message: "todo detail",
		Data:    project,
	})
}

func (h *todoHandler) CreateProject(c *fiber.Ctx) error {
	start := time.Now()
	numProjects := 100000
	projects := make([]Project, 0, numProjects)

	for i := 0; i < numProjects; i++ {
		project := Project{
			Title:       faker.Name(),
			Category:    faker.Name(),
			Description: faker.Name(),
		}
		projects = append(projects, project)
	}

	producer.PushDataToTopic[Project]("app.createTodo", projects)

	return c.JSON(&fiber.Map{
		"success":  true,
		"message":  "Projects pushed successfully",
		"projects": len(projects),
		"elapsed":  time.Since(start).Seconds(),
	})
}

func CreateProjectMulti(c *fiber.Ctx) error {
	var projects []Project
	var wg sync.WaitGroup
	projectChan := make(chan Project)

	for i := 0; i < 100000; i++ {
		project := Project{
			Title:       faker.Name(),
			Category:    faker.Name(),
			Description: faker.Name(),
		}
		projects = append(projects, project)
	}

	fmt.Println("Projects: ", len(projects))

	// Goroutine to push projects to topic
	go func() {
		for project := range projectChan {
			// Push project to the topic
			b, _ := json.Marshal(project)
			producer.PushProjectToTopic("app.createTodo", b) //app.createTodo
			wg.Done()                                        // Signal completion after pushing project
		}
	}()

	// Add to the WaitGroup before spawning goroutines
	wg.Add(len(projects))

	// Send each project to a goroutine for processing
	for _, project := range projects {
		go func(p Project) {
			projectChan <- p // Send project to the channel
		}(project)
	}

	// Wait for all projects to be pushed
	wg.Wait()

	// Close the channel after sending all projects
	close(projectChan)

	return c.JSON(&fiber.Map{
		"success":  true,
		"message":  "Projects pushed successfully",
		"projects": projects,
	})
}

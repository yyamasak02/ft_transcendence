# Inception Project Makefile

# Variables
COMPOSE_FILE = docker-compose.local.yml

.PHONY: up down build clean test logs status help test-access mariadb-root python-shell

# Default target
help:
	@echo "🚀 Inception Project Commands:"
	@echo "  make up       - Start all containers"
	@echo "  make down     - Stop all containers"
	@echo "  make build    - Build all containers"
	@echo "  make clean    - Stop and remove all containers, volumes, and images"
	@echo "  make test     - Run integration test"
	@echo "  make logs     - Show container logs"
	@echo "  make status   - Show container status"

# Start all containers
up:
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "Swagger http://127.0.0.1:8080/documentation/"
	@echo "Backend http://127.0.0.1:8080"
	@echo "Frontend http://127.0.0.1:5173"
	@echo "CloudBeaver http://127.0.0.1:8000"

buildup:
	docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "Swagger http://127.0.0.1:8080/documentation/"
	@echo "Backend http://127.0.0.1:8080"
	@echo "Frontend http://127.0.0.1:5173"
	@echo "CloudBeaver http://127.0.0.1:8000"


# Stop all containers
down:
	docker compose -f $(COMPOSE_FILE) down

# Build and start all containers
build:
	docker compose -f $(COMPOSE_FILE) up -d --build

# Clean everything
clean:
	docker compose -f $(COMPOSE_FILE) down -v --rmi all
	docker system prune -f

# Run integration test
test:
	python3 test_integration.py

# Show logs
logs:
	docker compose -f $(COMPOSE_FILE) logs -f

# Show container status
status:
	@echo "📊 Container Status:"
	@docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
	@echo ""
	@echo "🌐 Networks:"
	@docker network ls | grep inception
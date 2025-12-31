# Inception Project Makefile

# Variables
COMPOSE_FILE = docker-compose.local.yml

.PHONY: up down build clean logs status help secrets ensure_envs

# Default target
help:
	@echo "🚀 Inception Project Commands:"
	@echo "  make init     - Install backend deps and initialize SQLite"
	@echo "  make up       - Start all containers"
	@echo "  make down     - Stop all containers"
	@echo "  make build    - Build all containers"
	@echo "  make clean    - Stop and remove all containers, volumes, and images"
	@echo "  make delete   - Clean and remove SQLite database file"
	@echo "  make test     - Run integration test"
	@echo "  make logs     - Show container logs"
	@echo "  make status   - Show container status"
	@echo "  make re       - Rebuild and start all containers"

urls:
	@echo "Swagger http://127.0.0.1:8080/docs/"
	@echo "Common Backend http://127.0.0.1:8080"
	@echo "Game Backend http://127.0.0.1:8081"
	@echo "TextChat Backend http://127.0.0.1:8082"
	@echo "Frontend http://127.0.0.1:5173"
	@echo "Nginx https://localhost:8443"
ensure_envs:
	@# Ensure env files exist so docker compose can parse the file even on fresh clones
	@for f in \
		./frontend/.env.local \
		./backends/common/.env.development \
		./backends/game/.env.development \
		./backends/text_chat/.env.development \
		./backends/connect/.env.development \
		./nginx/.env.local; do \
		[ -f "$$f" ] || { mkdir -p "$$(dirname "$$f")"; touch "$$f"; }; \
	done

# Start all containers
up: ensure_envs
	docker compose -f $(COMPOSE_FILE) up -d
	@$(MAKE) urls

# Stop all containers
down: ensure_envs
	docker compose -f $(COMPOSE_FILE) down

# Build and start all containers
build: ensure_envs
	docker compose -f $(COMPOSE_FILE) up -d --build
	@$(MAKE) urls

init: delete
	@$(MAKE) secrets
	@$(MAKE) ensure_envs
	BE_COM_CMD="sh -c 'npm run db:setup && npm run dev'" \
	docker compose -f $(COMPOSE_FILE) up -d
	@$(MAKE) urls

secrets:
	@bash scripts/secret.sh

# Clean everything
clean: ensure_envs
	docker compose -f $(COMPOSE_FILE) down -v --rmi all
	docker system prune -f

delete: clean
	rm -f backends/common/db/app.db
	rm -f backends/common/db/common.sqlite
	rm -f backends/common/.env.development backends/game/.env.development backends/text_chat/.env.development frontend/.env.local backends/connect/.env.development nginx/.env.local

# Show logs
logs: ensure_envs
	docker compose -f $(COMPOSE_FILE) logs -f

# Show container status
status:
	@echo "📊 Container Status:"
	@docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
	@echo ""
	@echo "🌐 Networks:"
	@docker network ls | grep ft_transcendence

#rebuild
re: clean up

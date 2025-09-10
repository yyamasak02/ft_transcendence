DOCKER_DEV = ./docker-compose.override.yml
DOCKER_PRD = ./docker-compose.yml

ifeq ($(ENV),prd)
	DOCKER_COMPOSE_FILE := $(DOCKER_PRD)
else
	DOCKER_COMPOSE_FILE := $(DOCKER_DEV)
endif

up:
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d

down:
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

build:
	docker-compose -f $(DOCKER_COMPOSE_FILE) build

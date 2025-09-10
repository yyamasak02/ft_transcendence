LOCAL_FILE=docker-compose.local.yml

up:
	docker-compose -f $(LOCAL_FILE) up -d --build
down:
	docker-compose -f $(LOCAL_FILE) down
rm:
	docker-compose -f $(LOCAL_FILE) down --rmi all
logs:
	docker-compose -f $(LOCAL_FILE) logs -f --tail 100
.PHONY: help env-up env-down logs ps build

help:
	@echo "Targets:"
	@echo "  env-up   - docker compose up with deploy/.env"
	@echo "  env-down - docker compose down"
	@echo "  build    - docker compose build"
	@echo "  logs     - tail logs for api/site/traefik"
	@echo "  ps       - show containers"

env-up:
	docker compose --env-file deploy/.env up -d --build

env-down:
	docker compose down

build:
	docker compose --env-file deploy/.env build

logs:
	docker compose logs -f danimezone-api danimezone-site traefik

ps:
	docker compose ps

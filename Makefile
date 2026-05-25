.PHONY: help up down logs db-migrate db-seed db-reset db-studio backend frontend build

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  Infrastructure"
	@echo "  up            Start PostgreSQL and MinIO (docker compose)"
	@echo "  down          Stop all docker services"
	@echo "  logs          Show docker service logs"
	@echo ""
	@echo "  Database"
	@echo "  db-migrate    Run prisma migrate dev"
	@echo "  db-seed       Seed initial data (admin account)"
	@echo "  db-reset      Reset DB + re-migrate + re-seed"
	@echo "  db-studio     Open Prisma Studio"
	@echo ""
	@echo "  Development"
	@echo "  dev-api       Start NestJS in watch mode"
	@echo "  dev-web       Start Next.js dev server"
	@echo "  build         Build backend"

# ─── Infrastructure ───────────────────────────────────────

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

# ─── Database ─────────────────────────────────────────────

db-migrate:
	cd backend && npx prisma migrate dev

db-seed:
	cd backend && npx prisma db seed

db-reset:
	cd backend && npx prisma migrate reset --force

db-studio:
	cd backend && npx prisma studio

# ─── Development ──────────────────────────────────────────

backend:
	cd backend && npm run start:dev

frontend:
	cd frontend && npm run dev

build:
	cd backend && npm run build

# =============================================
# MCP Diagnostics System - Development Makefile
# =============================================

.PHONY: help build up down logs clean test migrate reset dev prod

# Default target
help: ## Show this help message
	@echo "MCP Diagnostics System - Available Commands:"
	@echo "=============================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =============================================
# Setup Commands
# =============================================

setup: ## Initial setup - copy environment files and install dependencies
	@echo "🔧 Setting up MCP Diagnostics System..."
	@cp env.local.template .env.local || echo "⚠️  .env.local already exists"
	@echo "✅ Setup complete! Edit .env.local with your configuration."
	@echo "📝 Next steps:"
	@echo "   1. Update .env.local with your settings"
	@echo "   2. Run 'make up' to start the development environment"

# =============================================
# Docker Compose Commands
# =============================================

build: ## Build all Docker images
	@echo "🏗️  Building Docker images..."
	docker-compose build

up: ## Start all services in development mode
	@echo "🚀 Starting development environment..."
	docker-compose --profile dev up -d
	@echo "✅ Services started!"
	@echo "🌐 Frontend: http://localhost:5173"
	@echo "🔧 MCP Backend: http://localhost:3000"
	@echo "🗄️  pgAdmin: http://localhost:5050"

down: ## Stop all services
	@echo "🛑 Stopping all services..."
	docker-compose down

restart: down up ## Restart all services

logs: ## Show logs for all services
	docker-compose logs -f

logs-backend: ## Show logs for backend service only
	docker-compose logs -f mcp-backend

logs-frontend: ## Show logs for frontend service only
	docker-compose logs -f frontend

logs-db: ## Show logs for database service only
	docker-compose logs -f db

# =============================================
# Database Commands
# =============================================

migrate: ## Run database migrations
	@echo "🗄️  Running database migrations..."
	docker-compose --profile migration up flyway
	@echo "✅ Migrations completed!"

migrate-info: ## Show migration status
	docker-compose run --rm flyway info

db-shell: ## Open PostgreSQL shell
	docker-compose exec db psql -U mcp_user -d mcp_diagnostics

db-reset: ## Reset database (WARNING: Destroys all data)
	@echo "⚠️  WARNING: This will destroy all database data!"
	@read -p "Are you sure? (y/N) " confirm && [ "$$confirm" = "y" ]
	docker-compose down -v
	docker-compose --profile migration up flyway
	@echo "🗄️  Database reset complete!"

# =============================================
# Development Commands
# =============================================

dev: ## Start development environment with hot reload
	@echo "👨‍💻 Starting development environment..."
	docker-compose --profile dev up

dev-build: ## Rebuild and start development environment
	docker-compose --profile dev up --build

shell-backend: ## Open shell in backend container
	docker-compose exec mcp-backend /bin/bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend /bin/sh

# =============================================
# Testing Commands
# =============================================

test: ## Run all tests
	@echo "🧪 Running tests..."
	@echo "📋 Ensuring services are running..."
	@docker-compose ps | grep -q "mcp-backend.*Up" || (echo "⚠️  Backend not running. Starting services..." && $(MAKE) up)
	@echo "🗄️  Ensuring database schema is up to date..."
	@$(MAKE) migrate
	@echo "🧪 Running backend tests..."
	docker-compose exec mcp-backend npm test
	@echo "✅ All tests completed successfully!"

test-backend: ## Run backend tests only
	@echo "🧪 Running backend tests..."
	@docker-compose ps | grep -q "mcp-backend.*Up" || (echo "⚠️  Backend not running. Starting services..." && $(MAKE) up)
	docker-compose exec mcp-backend npm test
	@echo "✅ Backend tests completed successfully!"

test-mcp: ## Test MCP server functionality
	@echo "🧪 Testing MCP server functionality..."
	@docker-compose ps | grep -q "mcp-backend.*Up" || (echo "⚠️  Backend not running. Starting services..." && $(MAKE) up)
	docker-compose exec mcp-backend npm run test:mcp

test-db: ## Test database connectivity
	@echo "🧪 Testing database connectivity..."
	@docker-compose ps | grep -q "mcp-backend.*Up" || (echo "⚠️  Backend not running. Starting services..." && $(MAKE) up)
	docker-compose exec mcp-backend npm run test:postgresql

test-quick: ## Quick test without service checks (assumes services are running)
	@echo "🚀 Quick test (assumes services are running)..."
	docker-compose exec mcp-backend npm test
	@echo "✅ Quick tests completed successfully!"

# =============================================
# Production Commands
# =============================================

prod-build: ## Build production images
	@echo "🏭 Building production images..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up: ## Start production environment
	@echo "🚀 Starting production environment..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# =============================================
# Cloud Commands
# =============================================

cloud-proxy: ## Start Cloud SQL Auth Proxy (requires GCP authentication)
	@echo "☁️  Starting Cloud SQL Auth Proxy..."
	docker-compose --profile cloud up auth-proxy

deploy-prep: ## Prepare for Cloud Run deployment
	@echo "☁️  Preparing for Cloud Run deployment..."
	@echo "📋 Pre-deployment checklist:"
	@echo "   ✓ Environment variables configured in Cloud Run"
	@echo "   ✓ Cloud SQL instance created"
	@echo "   ✓ Database migrations applied"
	@echo "   ✓ Secrets configured in Secret Manager"
	@echo "📦 Building production images..."
	$(MAKE) prod-build

# =============================================
# Utility Commands
# =============================================

clean: ## Clean up Docker resources
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete!"

status: ## Show service status
	@echo "📊 Service Status:"
	docker-compose ps

health: ## Check service health
	@echo "🏥 Health Check:"
	@curl -s http://localhost:3000/health || echo "❌ Backend not responding"
	@curl -s http://localhost:5173/health || echo "❌ Frontend not responding"

# =============================================
# Documentation
# =============================================

docs: ## Open documentation
	@echo "📚 Opening documentation..."
	@echo "🌐 Frontend: http://localhost:5173"
	@echo "🔧 MCP Backend: http://localhost:3000"
	@echo "🗄️  pgAdmin: http://localhost:5050 (admin@example.com / admin123)"
	@echo "📊 Docker Compose Status:"
	$(MAKE) status 
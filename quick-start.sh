#!/bin/bash

# =============================================
# MCP Diagnostics System - Quick Start Script
# =============================================

set -e

echo "🚀 MCP Diagnostics System - Quick Start"
echo "========================================"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if Docker Compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker Compose is available"

# Setup environment if needed
if [ ! -f .env.local ]; then
    echo "📋 Setting up environment..."
    make setup
else
    echo "✅ Environment already configured"
fi

# Build images
echo "🏗️  Building Docker images..."
docker-compose build

# Start the database first
echo "🗄️  Starting database..."
docker-compose up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "🗄️  Running database migrations..."
docker-compose --profile migration up flyway

# Start all services
echo "🚀 Starting all services..."
docker-compose --profile dev up -d

echo ""
echo "✅ MCP Diagnostics System started successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Access URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3000"
echo "   pgAdmin:   http://localhost:5050"
echo "   Health:    http://localhost:3000/health"
echo ""
echo "📋 Useful Commands:"
echo "   View logs:     make logs"
echo "   Stop services: make down"
echo "   Reset DB:      make db-reset"
echo "   Help:          make help"
echo ""
echo "🎉 Happy coding!" 
# MCP Diagnostics System - Containerized Setup

A containerized Medical Diagnostic Assistant system built with Node.js/Python backend (MCP server) and React frontend, designed to run locally with easy deployment to Google Cloud Run.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  React Frontend │    │   MCP Backend    │    │   PostgreSQL    │
│   (Port 5173)   │◄──►│ Node.js + Python │◄──►│   (Port 5432)   │
│     + Vite      │    │   (Port 3000)    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌──────────────────┐
                    │  Cloud SQL Auth  │
                    │  Proxy (5433)    │
                    │ (Optional/Cloud) │
                    └──────────────────┘
```

## ✨ Recent Improvements

This system has been recently optimized and containerized with the following enhancements:

### 🔧 **Infrastructure Fixes**
- ✅ **Port Mapping**: Fixed frontend container mapping from `5173:5173` to `5173:80` (nginx)
- ✅ **Database Connection**: Enhanced connection logic to support both local PostgreSQL and Cloud SQL
- ✅ **Dependencies**: Added missing PostgreSQL drivers (`psycopg2-binary`, `sqlalchemy`)
- ✅ **Docker Compose**: Removed obsolete configuration and fixed service dependencies

### 🧪 **Testing Improvements**
- ✅ **Test Scripts**: Updated test URLs from production to local endpoints
- ✅ **npm Scripts**: Added generic `test` script for consistent test execution
- ✅ **TypeScript**: Relaxed unused variable checking for development workflow
- ✅ **Comprehensive Tests**: All 6 database operation tests now passing

### 📚 **Documentation & Cleanup**
- ✅ **README**: Comprehensive documentation with troubleshooting guide
- ✅ **File Structure**: Removed redundant documentation and temporary files
- ✅ **Troubleshooting**: Added specific solutions for common issues
- ✅ **Development Workflow**: Clear commands and setup instructions

### 🚀 **Developer Experience**
- ✅ **Quick Start**: 3-step setup process (`make setup`, `make up`, `make migrate`)
- ✅ **Hot Reload**: Both frontend and backend support live reloading
- ✅ **Health Checks**: All services include proper health monitoring
- ✅ **Error Handling**: Improved error messages and debugging capabilities

---

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- Google Cloud CLI (for cloud deployment)

### 1. Setup

```bash
# Clone and navigate to the repository
cd MCP_TEST

# Initial setup (copies environment template)
make setup

# Edit your local environment variables
nano .env.local
```

### 2. Start Development Environment

```bash
# Start all services (frontend, backend, database, pgAdmin)
make up

# Or start with logs visible
make dev
```

### 3. Access Services

- **Frontend**: http://localhost:5173
- **MCP Backend**: http://localhost:3000
- **pgAdmin**: http://localhost:5050 (admin@example.com / admin123)
- **Database**: localhost:5432

### 4. Run Database Migrations

```bash
# Apply database schema
make migrate
```

## 📋 Available Commands

```bash
make help                 # Show all available commands
make setup               # Initial setup
make up                  # Start all services
make dev                 # Start with hot reload
make down                # Stop all services
make logs                # View logs
make migrate             # Run database migrations
make test                # Run all tests
make clean               # Clean up Docker resources
```

## 🛠️ Development Workflow

### Local Development

1. **Start the stack**: `make up`
2. **Run migrations**: `make migrate`
3. **Start developing**: Services auto-reload on file changes
4. **View logs**: `make logs` or `make logs-backend`
5. **Database access**: `make db-shell` or use pgAdmin

### Testing

```bash
make test              # Run all tests
make test-backend      # Backend tests only
make test-mcp          # Test MCP server functionality
make test-db           # Test database connectivity
```

### Database Management

```bash
make migrate           # Apply migrations
make migrate-info      # Show migration status
make db-shell          # PostgreSQL shell access
make db-reset          # Reset database (destroys data!)
```

## 🏗️ Project Structure

```
MCP_TEST/
├── docker-compose.yml          # Main compose file
├── Makefile                    # Development commands
├── env.local.template          # Environment template
├── env.production.template     # Production template
│
├── my_cloud_run_mcp/          # MCP Backend
│   ├── Dockerfile             # Multi-stage Node.js + Python
│   ├── mcp-server.js          # Main MCP server
│   ├── package.json           # Node.js dependencies
│   ├── requirements.txt       # Python dependencies
│   └── tools.js               # MCP tools implementation
│
├── Dspace_working/            # React Frontend
│   ├── Dockerfile             # Multi-stage React build
│   ├── nginx.conf             # Production nginx config
│   ├── package.json           # React dependencies
│   └── src/                   # React source code
│
└── sql/                       # Database Schema
    ├── migrations/            # Flyway migrations
    │   └── V1__initial_schema.sql
    └── init/                  # Database initialization
        └── 01_init_db.sql
```

## 🌐 Environment Configuration

### Local Development (.env.local)

```bash
# Copy template and edit
cp env.local.template .env.local

# Key settings:
NODE_ENV=development
DATABASE_URL=postgresql://mcp_user:dev_password_123@db:5432/mcp_diagnostics
GEMINI_API_KEY=your_gemini_api_key_here
MCP_HTTP_MODE=true
```

### Production (Cloud Run)

```bash
# Use env.production.template as reference
NODE_ENV=production
PORT=8080
CLOUD_SQL_CONNECTION_NAME=your-project:region:instance
DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/db
```

## ☁️ Cloud Deployment

### 1. Prepare for Cloud Run

```bash
# Build production images
make prod-build

# Check deployment readiness
make deploy-prep
```

### 2. Cloud SQL Setup

```bash
# Create Cloud SQL instance
gcloud sql instances create mcp-diagnostics \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database and user
gcloud sql databases create mcp_diagnostics_prod --instance=mcp-diagnostics
gcloud sql users create mcp_prod_user --instance=mcp-diagnostics --password=SECURE_PASSWORD
```

### 3. Deploy to Cloud Run

```bash
# Backend deployment
cd my_cloud_run_mcp
gcloud run deploy mcp-backend \
    --source . \
    --region=us-central1 \
    --allow-unauthenticated \
    --set-env-vars NODE_ENV=production \
    --add-cloudsql-instances=PROJECT:REGION:INSTANCE

# Frontend deployment  
cd ../Dspace_working
gcloud run deploy mcp-frontend \
    --source . \
    --region=us-central1 \
    --allow-unauthenticated
```

## 🧪 Testing the MCP Server

### Local Testing

```bash
# Test MCP functionality
make test-mcp

# Test database connectivity
make test-db

# Manual MCP inspector
docker-compose exec mcp-backend npx @modelcontextprotocol/inspector node mcp-server.js
```

### Production Testing

```bash
# Test deployed service
python my_cloud_run_mcp/main.py
```

## 📊 Monitoring & Debugging

### View Logs

```bash
make logs                    # All services
make logs-backend           # Backend only
make logs-frontend          # Frontend only
make logs-db               # Database only
```

### Health Checks

```bash
make health                 # Check service health
curl http://localhost:3000/health  # Backend health
curl http://localhost:5173/health  # Frontend health
```

### Database Debugging

```bash
make db-shell              # PostgreSQL shell
docker-compose exec db pg_isready -U mcp_user  # Connection test
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Frontend "Site Cannot Be Reached" Error**
**Problem**: Browser shows "This site can't be reached" when accessing http://localhost:5173

**Solution**: This is usually a port mapping issue. The frontend container runs nginx on port 80, not 5173.
```bash
# Check current port mapping
docker-compose ps frontend

# Should show: 0.0.0.0:5173->80/tcp (not 5173->5173)
# If incorrect, restart with correct mapping:
docker-compose up -d frontend --force-recreate
```

#### 2. **Port Conflicts**
**Problem**: "Port already in use" errors

**Solution**: Change ports in docker-compose.yml or stop conflicting services
```bash
# Check what's using the port
lsof -i :5173
# or
netstat -tulpn | grep 5173

# Clean up and restart
make clean
make up
```

#### 3. **Database Connection Issues**
**Problem**: Backend can't connect to PostgreSQL

**Solution**: Check database credentials and network connectivity
```bash
# Check database status
make logs-db
docker-compose exec db pg_isready -U mcp_user

# Reset database if needed
make db-reset
```

#### 4. **Migrations Failing**
**Problem**: Database migrations fail to apply

**Solution**: Ensure database is running and accessible
```bash
# Ensure database is healthy
docker-compose ps db
# Should show: (healthy)

# Run migrations
make migrate

# If still failing, reset and try again
make db-reset
make migrate
```

#### 5. **Frontend Not Loading Properly**
**Problem**: Frontend loads but shows errors or blank page

**Solution**: Check backend connectivity and rebuild if needed
```bash
# Check backend is running
curl http://localhost:3000/health

# Rebuild frontend with updated configuration
docker-compose build frontend
docker-compose up -d frontend --force-recreate
```

#### 6. **Test Failures**
**Problem**: `make test` shows failing tests

**Solution**: Common test issues and fixes
```bash
# Ensure all services are healthy
docker-compose ps

# Check specific test logs
make test-backend
make test-db

# If pytest errors occur, they're expected (not installed)
# The npm test should work correctly
```

### Reset Everything

If you encounter multiple issues, the nuclear option:

```bash
# Complete cleanup and fresh start
make clean                  # Clean Docker resources
rm .env.local              # Remove local config (will need to setup again)
make setup                 # Re-setup environment
make up                    # Start fresh
make migrate               # Apply database schema
make test                  # Verify everything works
```

### Getting Help

1. **Check service logs**: `make logs` or `make logs-backend`
2. **Verify service status**: `make status`
3. **Health checks**: `make health`
4. **Database debugging**: `make db-shell`

---

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test locally: `make test`
4. Submit a pull request

## 📝 License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details. 
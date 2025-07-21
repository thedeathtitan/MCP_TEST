# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Frontend Development (Dspace_working/)
- `npm run dev` - Start development server on http://localhost:5173
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint code quality checks
- `npm run preview` - Preview production build

### Full System Development (from project root ../MCP_TEST/)
- `make up` - Start all services (frontend, backend, database) in development mode
- `make migrate` - Apply database migrations using Flyway
- `make test` - Run comprehensive test suite across all services
- `make logs` - View logs for all services
- `make logs-frontend` - View frontend-specific logs
- `make down` - Stop all services
- `make clean` - Clean up Docker resources

### Service-Specific Commands
- `make logs-backend` - View MCP backend logs
- `make logs-db` - View PostgreSQL database logs
- `make db-shell` - Open PostgreSQL shell
- `make shell-frontend` - Open shell in frontend container

## High-Level Architecture

### System Overview
This is a **Medical Diagnostic Assistant** with a React frontend that integrates OpenAI O3 through a Model Context Protocol (MCP) backend, featuring 3D visualization and PostgreSQL persistence.

**Key Data Flow:**
```
Clinical Note → MCP Client → OpenAI O3 → Medical Analysis → PostgreSQL Storage → 3D Visualization
```

### Core Components

**Frontend (src/):**
- `src/utils/mcpClient.ts` - MCP protocol client with bulletproof JSON parsing
- `src/components/Graph3D.tsx` - Three.js 3D medical visualization
- `src/store/diagStore.ts` - Zustand state management with persistence
- `src/components/ApiKeyInput.tsx` - Secure OpenAI API key management
- `src/utils/openai.ts` - OpenAI integration wrapper

**MCP Backend (../my_cloud_run_mcp/):**
- Node.js server implementing Model Context Protocol
- `analyze_medical_note` tool for comprehensive medical reasoning
- PostgreSQL integration for persistent analytics
- Health endpoints and service discovery

**Database Schema:**
- `nodes` - Medical concepts (diagnoses, actions)
- `user_interactions` - Session tracking and analytics
- `diagnosis_history` - Historical pattern tracking

### Technology Stack
- **Frontend**: React 19.1 + TypeScript 5.8 + Three.js + Material-UI v6
- **3D Graphics**: React Three Fiber with orbital controls and dynamic layouts
- **State Management**: Zustand with persistence
- **Build Tool**: Vite 6.3+ with hot reload
- **Backend Protocol**: Model Context Protocol (MCP) with JSON-RPC 2.0
- **AI Integration**: OpenAI O3 for medical reasoning
- **Database**: PostgreSQL 17 with Flyway migrations
- **Containerization**: Docker Compose multi-service orchestration

### Key Architectural Patterns

**MCP Integration:**
- Frontend implements custom MCP client with Server-Sent Events support
- Backend exposes medical analysis as discoverable MCP tools
- Bulletproof JSON parsing with multiple fallback strategies
- Session management across MCP interactions

**3D Visualization:**
- Medical concepts rendered as interactive 3D nodes
- Spiral layout algorithm for optimal spacing
- Color-coded priority system (red=urgent, blue=diagnosis, green=actions)
- Dynamic sizing based on likelihood/confidence scores

**Database Analytics:**
- Anonymous session tracking for interaction analytics
- Complete diagnostic workflow persistence
- Evidence chains and clinical reasoning storage
- Performance metrics and model usage tracking

### Development Environment Setup

**Prerequisites:**
- Node.js 18+
- Docker and Docker Compose
- OpenAI API key (optional for analysis, required for voice transcription)

**Environment Configuration:**
- Copy `.env.local.template` to `.env.local` in project root
- Add `OPENAI_API_KEY=your_key_here` for full functionality
- Frontend works without API key using MCP server backend

**Service Dependencies:**
- Frontend depends on MCP backend (port 3000)
- Backend depends on PostgreSQL (port 5432)
- pgAdmin available on port 5050 for database management

### Medical Functionality

**Clinical Analysis Features:**
- Comprehensive differential diagnosis generation
- Evidence-based diagnostic reasoning
- ICD-10 problem list generation with billing codes
- Next action recommendations with priority levels
- Medical concept relationship mapping

**AI Integration Specifics:**
- OpenAI O3 with specialized emergency medicine prompts
- Sub-5-second response times for complex clinical cases
- Structured medical reasoning with likelihood scoring
- Multi-category analysis (cardiovascular, pulmonary, infectious, etc.)

### Testing Strategy

**Quality Assurance:**
- `npm run lint` ensures ESLint compliance
- `npm run build` verifies TypeScript compilation
- `make test` runs full system integration tests
- Health checks for all containerized services

**Performance Benchmarks:**
- Medical analysis: < 5 seconds for complex cases
- 3D rendering: 60 FPS smooth visualization
- Database operations: < 100ms standard queries
- Container startup: < 30 seconds full system

### Security and Compliance

**API Key Management:**
- Local browser storage for development
- Secret Manager integration for production
- Keys never transmitted to application servers

**Medical Data Handling:**
- Anonymous session tracking only
- No patient identifiers stored
- Research/education disclaimers
- HTTPS transport for production

### Production Deployment

**Cloud Run Ready:**
- Backend configured for Google Cloud Run
- Cloud SQL PostgreSQL integration
- Multi-architecture container builds
- Auto-scaling and health monitoring

**Container Orchestration:**
- Development: `make up` starts all services locally
- Production: `make prod-up` with production configurations
- Database migrations: `make migrate` applies schema changes
- Monitoring: `make status` and `make health` for service status

## Important Notes

- **Medical Disclaimer**: System designed for education/research only, not clinical diagnosis
- **API Key Optional**: Medical analysis works without OpenAI key via MCP backend
- **Voice Features**: Require OpenAI API key for Whisper transcription
- **Database Persistence**: All interactions tracked for analytics and improvement
- **3D Performance**: Optimized for 60 FPS rendering with dynamic node layouts
- **MCP Protocol**: Implements standardized AI agent communication for scalability
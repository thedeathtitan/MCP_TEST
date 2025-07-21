# 🏥 Medical Diagnostic Assistant - AI-Powered 3D Diagnostic System

A comprehensive medical diagnostic assistant that combines **OpenAI O3** reasoning, **interactive 3D visualization**, **PostgreSQL analytics**, and **Model Context Protocol (MCP)** architecture for intelligent clinical decision support.

## 🎯 System Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  React Frontend │    │   MCP Backend    │    │   PostgreSQL    │
│  Three.js 3D    │◄──►│ OpenAI O3   │◄──►│  Analytics DB   │
│   (Port 5173)   │    │   (Port 3000)    │    │   (Port 5432)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌──────────────────┐
                    │  Cloud SQL Auth  │
                    │  Proxy (5433)    │
                    │ (Production)     │
                    └──────────────────┘
```

## ✨ Key Features

### 🤖 **AI-Powered Medical Analysis**
- **OpenAI O3 Integration**: Advanced medical reasoning and diagnostic analysis
- **Structured Clinical Prompts**: Emergency medicine expertise built into prompts
- **Evidence-Based Diagnostics**: Likelihood scoring with clinical evidence
- **ICD-10 Problem Lists**: Automatic generation of billable medical codes

### 🎨 **Interactive 3D Visualization**
- **Three.js Knowledge Graphs**: Immersive 3D medical concept visualization
- **Dynamic Node Sizing**: Diagnosis confidence represented visually
- **Medical Color Coding**: Urgency-based coloring (red=urgent, green=actions)
- **Interactive Navigation**: Hover, click, rotate, and zoom controls

### 🗄️ **Persistent Data Analytics**
- **PostgreSQL Database**: Full persistence of all diagnostic sessions
- **User Session Tracking**: Historical analysis and pattern recognition
- **Diagnosis Trends**: Medical pattern analytics over time
- **Evidence Storage**: Complete clinical reasoning chains stored

### 🛡️ **MCP Architecture**
- **Model Context Protocol**: Standardized AI agent communication
- **Tool-Based Design**: Medical analysis as discoverable tools
- **Scalable Framework**: Easy addition of new diagnostic capabilities
- **Transport Flexibility**: HTTP, SSE, and stdio transports

### 🐳 **Production-Ready Infrastructure**
- **Docker Containerization**: Complete multi-service setup
- **Health Monitoring**: Comprehensive health checks for all services
- **Cloud SQL Ready**: Google Cloud SQL integration for production
- **Local Development**: Full-featured local development environment

---

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose**
- **OpenAI API Key** (for O3 model)
- **Node.js 18+** (for local development)
- **Google Cloud CLI** (for cloud deployment)

### 1. Initial Setup

```bash
# Clone and navigate
git clone <repository-url>
cd MCP_TEST

# Copy environment template
cp env.local.template .env.local

# Add your OpenAI API key
nano .env.local
# Set: OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Start the System

```bash
# Start all services (database, backend, frontend)
make up

# Apply database migrations
make migrate

# View logs to confirm everything is working
make logs
```

### 3. Access the System

- **🎯 Medical Interface**: http://localhost:5173
- **🔧 MCP Backend**: http://localhost:3000
- **📊 Database Admin**: http://localhost:5050 (admin@example.com / admin123)
- **💾 PostgreSQL**: localhost:5432

## 📋 Development Commands

```bash
make help                 # Show all available commands
make setup               # Initial setup with environment template
make up                  # Start all services in background
make dev                 # Start with live logs visible
make down                # Stop all services
make restart             # Restart specific services
make logs                # View combined logs
make logs-backend        # View backend logs only
make logs-frontend       # View frontend logs only
make migrate             # Apply database migrations
make test                # Run comprehensive test suite
make clean               # Clean up Docker resources
```

## 🔬 How It Works

### 1. **Medical Analysis Flow**
```
Clinical Note → MCP Client → OpenAI O3 → JSON Response → PostgreSQL Storage → 3D Visualization
```

### 2. **OpenAI Integration** (`tools.js`)
```javascript
// Advanced medical reasoning with O3
const result = await openai.chat.completions.create({
  model: 'o3',
  messages: [
    {
      role: "system", 
      content: "You are an expert emergency medicine physician..."
    },
    {
      role: "user",
      content: comprehensiveMedicalPrompt
    }
  ],
  max_completion_tokens: 8000
});
```

### 3. **3D Visualization** (`Graph3D.tsx`)
```javascript
// Three.js 3D spiral layout with medical properties
const nodes3D = useMemo(() => {
  return graph.nodes.map((node, index) => {
    const angle = (index * 2.5) % (Math.PI * 2);
    const radius = 3 + (index * 0.5);
    const height = Math.sin(index * 0.8) * 2;
    
    return {
      position: [
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      ],
      size: basedOnLikelihood * confidence,
      color: priorityBasedColoring
    };
  });
}, [graph.nodes]);
```

### 4. **Database Persistence** (`cloud-sql.js`)
```javascript
// Store all diagnostic results
await recordInteraction(
  sessionId, 
  clinical_note, 
  frontendResponse,
  processingTime,
  'o3',
  nodesCreated
);
```

## 🏗️ Project Structure

```
MCP_TEST/
├── 🐳 docker-compose.yml           # Multi-service orchestration
├── 📝 Makefile                     # Development workflow commands
├── 🔧 env.local.template           # Environment configuration
│
├── 🖥️ Dspace_working/              # React Frontend
│   ├── 🎨 src/components/Graph3D.tsx    # Three.js visualization
│   ├── 📡 src/utils/mcpClient.ts        # MCP communication
│   ├── 🎯 src/utils/openai.ts           # OpenAI integration
│   └── 🎨 src/theme.ts                  # Material-UI theming
│
├── 🤖 my_cloud_run_mcp/           # MCP Backend Server
│   ├── 🔧 mcp-server.js                # Main MCP server
│   ├── 🛠️ tools.js                     # Medical analysis tools
│   ├── 🗄️ lib/cloud-sql.js             # PostgreSQL integration
│   └── 📦 package.json                 # Node.js dependencies
│
└── 🗄️ sql/                        # Database Schema
    ├── 📋 migrations/V1__initial_schema.sql
    └── 🔧 init/01_init_db.sql
```

## 🧪 Testing

```bash
# Comprehensive test suite
make test                          # All tests
make test-backend                  # Backend tests only
make test-db                       # Database connectivity tests
make test-mcp                      # MCP server functionality tests

# Manual testing endpoints
curl http://localhost:3000/health  # Backend health check
curl http://localhost:5173/health  # Frontend health check
```

## 📊 Database Schema

### Core Medical Tables
```sql
-- Medical concepts and diagnoses
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,     -- Medical term
  type VARCHAR(100) NOT NULL,      -- 'diagnosis', 'next_action'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions and analytics
CREATE TABLE user_interactions (
  session_id VARCHAR(255) NOT NULL,
  clinical_note TEXT NOT NULL,
  analysis_result JSONB,           -- Full OpenAI response
  processing_time INTEGER,
  model_used VARCHAR(100),         -- 'o3'
  nodes_created INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical diagnosis tracking
CREATE TABLE diagnosis_history (
  interaction_id INTEGER NOT NULL,
  diagnosis_label VARCHAR(255),
  likelihood DECIMAL(3,2),
  confidence DECIMAL(3,2),
  evidence JSONB                   -- Clinical evidence array
);
```

## 🌐 Environment Configuration

### Local Development
```bash
# .env.local
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://mcp_user:dev_password_123@db:5432/mcp_diagnostics
POSTGRES_PASSWORD=dev_password_123
PGADMIN_PASSWORD=admin123
VITE_MCP_API_URL=http://localhost:3000
```

### Production (Cloud Run)
```bash
# env.production.template
NODE_ENV=production
CLOUD_SQL_CONNECTION_NAME=your-project:region:instance
DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/db
OPENAI_API_KEY=set_via_secret_manager
```

## ☁️ Cloud Deployment

### 1. Build for Production
```bash
make prod-build
```

### 2. Deploy to Google Cloud Run
```bash
# Backend deployment
gcloud run deploy mcp-backend \
  --source ./my_cloud_run_mcp \
  --region=us-central1 \
  --set-env-vars OPENAI_API_KEY=${OPENAI_API_KEY}

# Frontend deployment  
gcloud run deploy frontend \
  --source ./Dspace_working \
  --region=us-central1
```

### 3. Set up Cloud SQL
```bash
gcloud sql instances create mcp-diagnostics \
  --database-version=POSTGRES_17 \
  --tier=db-f1-micro \
  --region=us-central1
```

## 🛡️ Security & Privacy

- **🔐 Local API Keys**: OpenAI keys stored locally, not transmitted
- **🗄️ Data Persistence**: All analysis stored in PostgreSQL for analytics
- **🔒 Secure Transport**: HTTPS for all cloud communications
- **📊 Session Tracking**: Anonymous session IDs for user analytics
- **🏥 Medical Compliance**: Designed for research and education use

## 🚨 Medical Disclaimers

- **⚠️ Research & Education Only**: Not intended for clinical diagnosis
- **👨‍⚩ Professional Review Required**: All outputs need medical validation  
- **🚫 No Medical Advice**: Tool does not replace clinical judgment
- **📋 Documentation Only**: For educational and development purposes

## 🎯 Use Cases

### 👨‍⚩ **Medical Education**
- Clinical case analysis and differential diagnosis training
- Emergency medicine workflow visualization
- Evidence-based reasoning demonstration

### 🔬 **Research Applications**
- Medical AI algorithm development
- Clinical decision support research
- Knowledge graph analysis of medical concepts

### 💻 **Development & Integration**
- MCP server development for healthcare AI
- Medical visualization component development
- PostgreSQL analytics for healthcare data

## 🏆 System Status

| Component | Technology | Status | Purpose |
|-----------|------------|---------|---------|
| **🤖 AI Analysis** | OpenAI O3 | ✅ Working | Medical reasoning |
| **🎨 3D Visualization** | Three.js + React | ✅ Working | Interactive graphs |
| **🛡️ MCP Protocol** | JSON-RPC 2.0 | ✅ Active | AI communication |
| **🗄️ Database** | PostgreSQL 17 | ✅ Integrated | Full persistence |
| **🐳 Containers** | Docker Compose | ✅ Complete | Development/Production |

## 📚 Documentation

- **📖 [Backend README](./my_cloud_run_mcp/README.md)**: MCP server documentation
- **🎨 [Frontend README](./Dspace_working/README.md)**: React app documentation
- **📊 [Project Status](./Dspace_working/PROJECT_STATUS.md)**: Current development status
- **🔧 [Troubleshooting](./TROUBLESHOOTING_SCRATCHPAD.md)**: Common issues and solutions

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/medical-enhancement`
3. **Make changes**: Follow TypeScript and medical coding standards
4. **Test thoroughly**: `make test`
5. **Submit pull request**: Include medical context and testing evidence

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

**🎯 Ready for Medical AI Development** | **Built with ❤️ for Healthcare Innovation** 
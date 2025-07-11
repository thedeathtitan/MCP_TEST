# 🤖 Medical Diagnostic MCP Server - OpenAI O3 Integration

An AI-powered medical diagnostic assistant backend built as a **Model Context Protocol (MCP)** server. This system processes clinical notes using **OpenAI O3**, generates comprehensive medical knowledge graphs, and provides persistent **PostgreSQL** storage for diagnostic analytics.

## 🎯 Project Overview

This MCP server enables AI agents and frontend applications to:
- **🧠 Advanced Medical Analysis**: Process clinical notes with OpenAI O3 reasoning
- **🗄️ PostgreSQL Integration**: Store and retrieve medical concepts, diagnoses, and user interactions
- **📊 Knowledge Graph Generation**: Create structured medical knowledge graphs in real-time
- **🛡️ MCP Protocol**: Standardized tool-based architecture for medical AI applications
- **🔄 Session Analytics**: Track user interactions and diagnostic patterns over time

## 🏗️ Architecture

- **🚀 Backend**: Node.js MCP Server (local/Cloud Run)
- **🗄️ Database**: PostgreSQL 17 (local/Cloud SQL)
- **🔐 Authentication**: Local API keys + Google Cloud IAM for production
- **🤖 AI Integration**: OpenAI O3 for medical reasoning
- **🛡️ Protocol**: Model Context Protocol (MCP) with JSON-RPC 2.0

## 🤖 OpenAI O3 Medical Integration

### **🩺 Intelligent Medical Analysis**
- **Advanced Reasoning**: O3's enhanced reasoning capabilities for complex medical cases
- **Structured Prompts**: Emergency medicine expertise built into comprehensive prompts
- **Evidence-Based Diagnostics**: Likelihood scoring with clinical evidence arrays
- **ICD-10 Integration**: Automatic generation of billable medical codes
- **Multi-Category Analysis**: Diagnosis groups, next actions, and comprehensive problem lists

### **📊 Comprehensive Response Format**
```json
{
  "diagnosis_groups": [
    {
      "group_id": "primary_cardiac",
      "group_name": "Primary Cardiac Conditions",
      "diagnoses": [
        {
          "id": "dx_1",
          "label": "Acute Heart Failure",
          "type": "diagnosis",
          "likelihood": 0.9,
          "confidence": 0.8,
          "evidence": ["S3 gallop", "bilateral crackles"],
          "category": "cardiac"
        }
      ]
    }
  ],
  "next_actions": [
    {
      "id": "action_1",
      "label": "Chest X-ray",
      "type": "next_action",
      "priority": "urgent",
      "timing": "STAT",
      "related_diagnosis_id": "dx_1"
    }
  ],
  "problem_list": [
    {
      "diagnosis": "Acute Heart Failure",
      "icd10Code": "I50.9",
      "likelihood": 0.9,
      "status": "active"
    }
  ]
}
```

## 🛠️ Available MCP Tools

### **Medical Analysis Tools**
- `analyze_medical_note`: **Primary tool** - Comprehensive medical analysis with O3-mini
  - Input: Clinical note text + optional OpenAI API key
  - Output: Structured diagnosis groups, next actions, relationships, problem list
  - Features: Evidence-based reasoning, ICD-10 codes, priority scoring

### **Database Management Tools**  
- `test_db_connection`: Verify PostgreSQL database connectivity
- `initialize_database`: Create medical concept tables and indexes
- `create_node`: Store medical concepts (symptoms, diagnoses, treatments)
- `get_node`: Retrieve specific medical nodes by ID
- `list_nodes`: Query nodes with filtering by type/category
- `update_node`: Modify node labels and medical classifications
- `delete_node`: Remove medical concepts from knowledge base

### **Session & Analytics Tools**
- `create_or_update_session`: Track user sessions for analytics
- `record_interaction`: Store complete diagnostic interactions
- `get_session_history`: Retrieve user interaction history
- `record_diagnosis_history`: Track diagnosis patterns over time

### **Cloud Infrastructure Tools** *(Production)*
- `deploy_file_contents`: Deploy to Google Cloud Run with file contents
- `list_services`: List Cloud Run services by project/region
- `get_service`: Retrieve Cloud Run service details
- `get_service_logs`: Access Cloud Run service logs and errors
- `list_projects`: List available GCP projects
- `create_project`: Create new GCP projects with billing

## 🚀 Setup & Installation

### **Option A: Docker Development (Recommended)**

**🐳 Full containerized setup with hot reload**

```bash
# Navigate to project root
cd MCP_TEST

# Copy environment template
cp env.local.template .env.local

# Set your OpenAI API key
nano .env.local
# Add: OPENAI_API_KEY=your_openai_api_key_here

# Start all services
make up

# Apply database migrations
make migrate

# Test the system
make test
```

Access:
- **MCP Server**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Database**: localhost:5432 (PostgreSQL)

### **Option B: Local Node.js Development**

**🔧 Direct Node.js development for MCP server**

```bash
# Navigate to backend directory
cd my_cloud_run_mcp

# Install dependencies
npm install

# Set environment variables
export OPENAI_API_KEY="your_api_key_here"
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Start MCP server
npm run start

# Or start with development watching
npm run dev
```

### **Option C: Cloud Run Production Deployment**

**☁️ Google Cloud Run deployment with Cloud SQL**

```bash
# Build and deploy
gcloud run deploy mcp-backend \
  --source . \
  --region=us-central1 \
  --set-env-vars OPENAI_API_KEY=${OPENAI_API_KEY} \
  --add-cloudsql-instances=PROJECT:REGION:INSTANCE

# Set up Cloud SQL PostgreSQL
gcloud sql instances create mcp-diagnostics \
  --database-version=POSTGRES_17 \
  --tier=db-f1-micro \
  --region=us-central1
```

## 🧪 Testing the MCP Server

### **Comprehensive Test Suite**
```bash
# All tests (from project root)
make test

# Backend-specific tests
make test-backend

# Database connectivity tests  
make test-db

# MCP protocol tests
make test-mcp
```

### **Manual API Testing**
```bash
# Health check
curl http://localhost:3000/health

# Test medical analysis tool via MCP
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "analyze_medical_note",
      "arguments": {
        "clinical_note": "67-year-old male presents with chest pain and shortness of breath",
        "api_key": "your_openai_api_key"
      }
    },
    "id": 1
  }'
```

### **Database Testing Scripts**
```bash
# PostgreSQL connection test
python test_postgresql_connection.py

# SQL functions test
python test_sql_functions.py

# Full integration test
python simple_test.py
```

## 📊 Database Schema & Analytics

### **Core Medical Tables**
```sql
-- Medical concepts and knowledge graph nodes
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,     -- Medical term (e.g., "Acute Heart Failure")
  type VARCHAR(100) NOT NULL,      -- 'diagnosis', 'next_action', 'symptom'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationships between medical concepts
CREATE TABLE relationships (
  id SERIAL PRIMARY KEY,
  source_node_id INTEGER NOT NULL,
  target_node_id INTEGER NOT NULL,
  relationship_type VARCHAR(100) NOT NULL,  -- 'indicates', 'treats', 'investigates'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User session tracking for analytics
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_identifier VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Complete diagnostic interactions
CREATE TABLE user_interactions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  clinical_note TEXT NOT NULL,
  analysis_result JSONB,           -- Full OpenAI O3-mini response
  processing_time INTEGER,         -- Milliseconds
  model_used VARCHAR(100),         -- 'o3-mini'
  nodes_created INTEGER DEFAULT 0,
  relationships_created INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical diagnosis tracking for pattern analysis
CREATE TABLE diagnosis_history (
  id SERIAL PRIMARY KEY,
  interaction_id INTEGER NOT NULL,
  diagnosis_label VARCHAR(255) NOT NULL,
  diagnosis_type VARCHAR(100) NOT NULL,
  likelihood DECIMAL(3,2),         -- 0.00 to 1.00
  confidence DECIMAL(3,2),         -- 0.00 to 1.00
  priority VARCHAR(50),            -- 'urgent', 'high', 'medium', 'low'
  category VARCHAR(100),           -- 'cardiac', 'respiratory', etc.
  evidence JSONB,                  -- Clinical evidence array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Analytics Queries**
```sql
-- Most common diagnoses
SELECT diagnosis_label, COUNT(*) as frequency, AVG(likelihood) as avg_confidence
FROM diagnosis_history 
GROUP BY diagnosis_label 
ORDER BY frequency DESC;

-- Processing time analysis
SELECT model_used, AVG(processing_time) as avg_time, COUNT(*) as interactions
FROM user_interactions 
GROUP BY model_used;

-- Evidence patterns
SELECT jsonb_array_elements_text(evidence) as evidence_item, COUNT(*) as frequency
FROM diagnosis_history 
WHERE evidence IS NOT NULL
GROUP BY evidence_item 
ORDER BY frequency DESC;
```

## 🔧 Configuration & Environment

### **Local Development Environment**
```bash
# .env.local or environment variables
NODE_ENV=development
PORT=3000

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://mcp_user:dev_password_123@db:5432/mcp_diagnostics
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=mcp_diagnostics
POSTGRES_USER=mcp_user
POSTGRES_PASSWORD=dev_password_123
```

### **Production Cloud Run Environment**
```bash
# Cloud Run environment variables
NODE_ENV=production
PORT=8080

# OpenAI (store in Secret Manager)
OPENAI_API_KEY=${OPENAI_API_KEY}

# Cloud SQL Configuration
INSTANCE_CONNECTION_NAME=project-id:region:instance-name
DB_NAME=mcp_diagnostics_prod
DB_USER=mcp_prod_user
DB_PASS=${DB_PASSWORD}  # From Secret Manager
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}
```

### **MCP Client Integration**
```json
{
  "mcpServers": {
    "medical-diagnostic-assistant": {
      "command": "node",
      "args": ["mcp-server.js"],
      "env": {
        "OPENAI_API_KEY": "your_key_here",
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

## 🔍 Development & Debugging

### **Viewing Logs**
```bash
# Container logs (from project root)
make logs-backend

# Direct Node.js logs
cd my_cloud_run_mcp
npm run dev  # Shows detailed logging

# Cloud Run logs
gcloud run logs read mcp-backend --region=us-central1
```

### **Database Debugging**
```bash
# PostgreSQL shell access
make db-shell

# Check database connectivity
docker-compose exec mcp-backend node -e "
const { testConnection } = require('./lib/cloud-sql.js');
testConnection().then(console.log).catch(console.error);
"

# View interaction history
psql postgresql://mcp_user:dev_password_123@localhost:5432/mcp_diagnostics
SELECT * FROM user_interactions ORDER BY created_at DESC LIMIT 5;
```

### **MCP Protocol Testing**
```bash
# Test tool availability
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'

# Test database initialization
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0", 
    "method": "tools/call",
    "params": {"name": "initialize_database", "arguments": {}},
    "id": 1
  }'
```

## 🛡️ Security & Best Practices

### **API Key Management**
- **Local Development**: Store in `.env.local` (never commit)
- **Production**: Use Google Secret Manager
- **Frontend**: Pass API keys via MCP tool parameters
- **Rotation**: Regular key rotation for production deployments

### **Database Security**
- **Authentication**: Strong passwords with PostgreSQL authentication
- **Network**: Private VPC networks for Cloud SQL
- **Encryption**: Data encryption at rest and in transit
- **Backups**: Automated backups for production databases

### **Medical Data Compliance**
- **🚨 Research Use Only**: Not for clinical diagnosis
- **📊 Analytics Only**: Store diagnostic patterns, not patient data
- **🔐 Anonymization**: Use session IDs, not patient identifiers
- **⏰ Data Retention**: Implement appropriate data lifecycle policies

## 📈 Performance & Scaling

### **Optimization Strategies**
```javascript
// Connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,              // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Batch operations
const batchCreateNodes = async (nodeData) => {
  const query = 'INSERT INTO nodes (label, type) VALUES ($1, $2) RETURNING *';
  return await Promise.all(
    nodeData.map(node => pool.query(query, [node.label, node.type]))
  );
};
```

### **Monitoring & Alerts**
```bash
# Health check endpoint
GET /health
# Returns: {"status": "ok", "timestamp": "...", "database": "connected"}

# Metrics endpoint (can be added)
GET /metrics
# Returns: Prometheus-compatible metrics
```

## 🚀 Deployment Checklist

### **Pre-Deployment**
- [ ] **Environment variables configured**
- [ ] **OpenAI API key set in Secret Manager**
- [ ] **Cloud SQL instance created and configured**
- [ ] **Database migrations applied**
- [ ] **Health checks passing**
- [ ] **Load testing completed**

### **Post-Deployment**
- [ ] **Service health verified**
- [ ] **Database connectivity confirmed**
- [ ] **MCP tools responding correctly**
- [ ] **Medical analysis working with O3-mini**
- [ ] **Monitoring and logging configured**

## 📚 Additional Resources

- **🛡️ [MCP Protocol Specification](https://modelcontextprotocol.io/)**
- **🤖 [OpenAI O3 Documentation](https://platform.openai.com/docs)**
- **🗄️ [PostgreSQL Documentation](https://www.postgresql.org/docs/)**
- **☁️ [Google Cloud Run Documentation](https://cloud.google.com/run/docs)**
- **🐳 [Docker Documentation](https://docs.docker.com/)**

## 🤝 Contributing

1. **🍴 Fork the repository**
2. **🌿 Create feature branch**: `git checkout -b feature/medical-enhancement`
3. **🔬 Follow medical coding standards** and include comprehensive tests
4. **🧪 Test thoroughly**: `make test` must pass
5. **📋 Submit pull request** with medical context and evidence

---

**🏥 Production-Ready Medical AI Backend** | **Built for Healthcare Innovation with OpenAI O3-mini**

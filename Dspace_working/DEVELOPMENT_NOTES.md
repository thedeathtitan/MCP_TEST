# 🏥 Medical Diagnostic Assistant - Development Notes

## 🚀 **CURRENT SYSTEM - VERSION 2.0.0**

**Architecture**: Containerized microservices with OpenAI O3, Three.js 3D visualization, MCP protocol, and PostgreSQL persistence.

---

## ⚡ **Quick Start Commands**

### **Full System Development**
```bash
# Navigate to project root
cd MCP_TEST

# Start complete system (all services)
make up

# Apply database migrations
make migrate

# Run comprehensive tests
make test

# View system logs
make logs

# Access endpoints:
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# Database: http://localhost:5050
```

### **Frontend-Only Development**
```bash
# Navigate to frontend directory
cd Dspace_working

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🏗️ **Current Architecture Overview**

### **Multi-Service Container Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  React Frontend │    │   MCP Backend    │    │   PostgreSQL    │
│  Three.js 3D    │◄──►│ OpenAI O3   │◄──►│  Analytics DB   │
│   (Port 5173)   │    │   (Port 3000)    │    │   (Port 5432)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Technology Stack**
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Frontend** | React + TypeScript | 19.1.0 + 5.8 | UI development |
| **3D Graphics** | Three.js + React Three Fiber | Latest | Medical visualization |
| **UI Components** | Material-UI (MUI) | v6 | Professional design |
| **State Management** | Zustand | 5.0+ | State with persistence |
| **Build Tool** | Vite | 6.3+ | Development + builds |
| **Backend** | Node.js MCP Server | 18+ | Medical AI processing |
| **AI Model** | OpenAI O3 | Latest | Medical reasoning |
| **Database** | PostgreSQL | 17 | Data persistence |
| **Protocol** | Model Context Protocol | 2024-11-05 | AI communication |
| **Containers** | Docker Compose | Latest | Orchestration |

---

## 🔧 **Key Implementation Details**

### **Three.js 3D Visualization System**
- **Replaced**: Cytoscape.js 2D graph library
- **Current**: Three.js with React Three Fiber ecosystem
- **Features**:
  - 3D medical nodes (spheres, boxes, octahedrons)
  - Dynamic sizing based on likelihood/confidence scores (0.8-2.0 scale)
  - Medical color coding (red=urgent, green=actions, blue=diagnoses)
  - OrbitControls for professional pan, zoom, rotate
  - Spiral layout algorithm for medical concept positioning
  - Floating HTML labels with medical terminology
  - Smooth animations and selection indicators

### **Three.js Medical Node Implementation**
```typescript
// Current 3D node structure
interface MedicalNode3D {
  id: string;
  label: string;
  type: 'diagnosis' | 'next_action' | 'symptom';
  position: [number, number, number];  // 3D coordinates
  size: number;                        // Based on likelihood (0.8-2.0)
  color: string;                       // Priority-based coloring
  priority: 'urgent' | 'high' | 'medium' | 'low';
  likelihood?: number;                 // 0.0-1.0 confidence score
  evidence?: string[];                 // Clinical evidence
}

// Three.js medical node component
const MedicalNode3D = ({ concept, position, likelihood, priority }) => {
  const nodeSize = 0.8 + (likelihood * 1.2);
  const nodeColor = priority === 'urgent' ? 'red' : 
                   priority === 'high' ? 'orange' :
                   'blue';
  
  return (
    <mesh position={position}>
      <sphereGeometry args={[nodeSize, 32, 32]} />
      <meshStandardMaterial color={nodeColor} />
    </mesh>
  );
};
```

### **OpenAI O3 Integration**
- **Model**: OpenAI O3 for advanced medical reasoning
- **Current API Pattern**:
```typescript
const analyzeMedicalNote = async (clinical_note: string, api_key: string) => {
  const response = await openai.chat.completions.create({
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
    max_completion_tokens: 8000,
    response_format: { type: "json_object" }
  });
  
  return parseComprehensiveMedicalResponse(response.choices[0].message.content);
};
```

### **MCP Protocol Communication**
- **Protocol**: Model Context Protocol (JSON-RPC 2.0)
- **Transport**: HTTP with fallback strategies
- **Tools**: Medical analysis exposed as discoverable MCP tools

```typescript
// MCP client communication pattern
const mcpClient = {
  async callTool(name: string, args: any) {
    const response = await fetch('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name, arguments: args },
        id: Date.now()
      })
    });
    return response.json();
  }
};
```

### **PostgreSQL Database Integration**
- **Current Schema**: Complete medical analytics and session tracking
```sql
-- Medical concepts storage
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User session analytics
CREATE TABLE user_interactions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  clinical_note TEXT NOT NULL,
  analysis_result JSONB,
  processing_time INTEGER,
  model_used VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical diagnosis tracking
CREATE TABLE diagnosis_history (
  id SERIAL PRIMARY KEY,
  interaction_id INTEGER NOT NULL,
  diagnosis_label VARCHAR(255) NOT NULL,
  likelihood DECIMAL(3,2),
  confidence DECIMAL(3,2),
  evidence JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **State Management (Zustand)**
```typescript
interface DiagStore {
  // Core state
  note: string;
  apiKey: string;
  graph: MedicalGraph;
  problemList: ProblemListItem[];
  sessionId: string;
  
  // 3D visualization state
  selectedNode: string | null;
  cameraPosition: [number, number, number];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setNote: (note: string) => void;
  setApiKey: (key: string) => void;
  setGraph: (graph: MedicalGraph) => void;
  analyzeNote: () => Promise<void>;
  
  // MCP communication
  callMCPTool: (toolName: string, args: any) => Promise<any>;
}
```

---

## 🛠️ **Development Workflow**

### **Container-Based Development**
```bash
# Complete system management
make up                    # Start all services
make down                  # Stop all services
make restart               # Restart all services
make clean                 # Clean up containers

# Individual service management
make restart-frontend      # Restart only frontend
make restart-backend       # Restart only backend
make restart-db           # Restart only database

# Development helpers
make logs                  # View all service logs
make logs-frontend        # Frontend logs only
make logs-backend         # Backend logs only
make logs-db              # Database logs only

# Testing and validation
make test                 # Run comprehensive tests
make test-frontend        # Frontend tests only
make test-backend         # Backend tests only
make test-db              # Database connectivity tests
```

### **Environment Configuration**
```bash
# Local Development (.env.local)
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://mcp_user:dev_password_123@db:5432/mcp_diagnostics
VITE_MCP_API_URL=http://localhost:3000
POSTGRES_PASSWORD=dev_password_123
PGADMIN_PASSWORD=admin123

# Production (env.production.template)
NODE_ENV=production
CLOUD_SQL_CONNECTION_NAME=project:region:instance
DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/db
OPENAI_API_KEY=set_via_secret_manager
```

---

## 🧪 **Testing Strategy**

### **Comprehensive Test Coverage**
```bash
# All systems testing
make test                    # Full integration tests

# Component testing
curl http://localhost:3000/health    # Backend health
curl http://localhost:5173           # Frontend health
psql postgresql://mcp_user:dev_password_123@localhost:5432/mcp_diagnostics

# Manual testing scenarios
1. Medical note analysis with O3
2. 3D visualization rendering and interaction
3. Database persistence of interactions
4. MCP protocol tool discovery and execution
5. Error handling and recovery
```

### **Performance Testing**
```bash
# Performance benchmarks
- AI Analysis: < 5 seconds for complex cases
- 3D Rendering: 60 FPS smooth visualization
- Database Queries: < 100ms for standard operations
- Container Startup: < 30 seconds full system
- Memory Usage: < 2GB total system footprint
```

---

## 🔍 **Troubleshooting & Debugging**

### **Common Development Issues**
1. **Container Connection Issues**
   ```bash
   # Check service health
   make logs
   docker-compose ps
   
   # Restart problematic service
   make restart-backend
   ```

2. **Database Connection Problems**
   ```bash
   # Test database connectivity
   make test-db
   
   # Access database directly
   make db-shell
   ```

3. **Frontend 3D Rendering Issues**
   ```bash
   # Check Three.js console errors
   # Verify WebGL support in browser
   # Test with different browsers
   ```

4. **OpenAI API Integration Issues**
   ```bash
   # Verify API key in .env.local
   # Check API usage limits
   # Test with curl directly
   ```

### **Performance Optimization Tips**
- Use React.memo for Three.js components
- Implement object pooling for 3D nodes
- Debounce MCP API calls
- Optimize database queries with indexes
- Use compression for Docker images

---

## 📊 **Database Management**

### **Migration Management**
```bash
# Apply database migrations
make migrate

# Check migration status
make migrate-info

# Reset database (WARNING: destroys data)
make db-reset
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

-- User session analytics
SELECT DATE(created_at) as date, COUNT(DISTINCT session_id) as unique_sessions
FROM user_interactions 
GROUP BY DATE(created_at) 
ORDER BY date DESC;
```

---

## 🚀 **Deployment & Production**

### **Cloud Run Deployment**
```bash
# Build for production
make prod-build

# Deploy to Google Cloud Run
gcloud run deploy mcp-backend --source ./my_cloud_run_mcp
gcloud run deploy frontend --source ./Dspace_working

# Set up Cloud SQL
gcloud sql instances create mcp-diagnostics \
  --database-version=POSTGRES_17 \
  --tier=db-f1-micro \
  --region=us-central1
```

### **Monitoring & Logging**
```bash
# Cloud Run logs
gcloud run logs read mcp-backend --region=us-central1

# Local monitoring
make logs           # All services
make health         # Health check endpoints
```

---

## 🔮 **Future Development Roadmap**

### **Version 2.1.0 - Enhanced AI Capabilities**
- [ ] Multi-model integration (GPT-4, Claude, Gemini)
- [ ] Specialty-specific medical reasoning modules
- [ ] SNOMED CT integration
- [ ] Evidence-based medicine with PubMed integration

### **Version 2.2.0 - Advanced 3D Features**
- [ ] Force-directed graph physics
- [ ] Visual connections between medical concepts
- [ ] Temporal visualization of diagnostic progression
- [ ] VR/AR support for immersive experiences

### **Version 3.0.0 - Enterprise Features**
- [ ] Multi-tenant architecture
- [ ] FHIR integration
- [ ] Comprehensive audit logging
- [ ] API rate limiting and security

---

## 📚 **Development Resources**

### **Core Technologies**
- **[Three.js Documentation](https://threejs.org/docs/)**
- **[React Three Fiber](https://docs.pmnd.rs/react-three-fiber)**
- **[Material-UI Documentation](https://mui.com/)**
- **[OpenAI API Reference](https://platform.openai.com/docs/)**
- **[PostgreSQL Documentation](https://www.postgresql.org/docs/)**

### **Project Documentation**
- **[Main README](../README.md)**: Complete project overview
- **[Backend README](../my_cloud_run_mcp/README.md)**: MCP server docs
- **[Project Status](PROJECT_STATUS.md)**: Current status
- **[Troubleshooting](../TROUBLESHOOTING_SCRATCHPAD.md)**: Common issues

---

**🏥 Production-Ready Development Environment** | **Built for Healthcare Innovation**

*Last Updated: January 2025 | System Version 2.0.0 | Status: OPERATIONAL*
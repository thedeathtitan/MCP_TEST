# Medical Diagnostic Assistant MCP Server

An AI-powered medical diagnostic assistant backend built as a Model Context Protocol (MCP) server. This system processes clinical notes, generates knowledge graphs of medical concepts, and provides a persistent PostgreSQL backend for diagnostic data.

## 🎯 Project Overview

This MCP server enables AI agents to:
- Connect to and manage a PostgreSQL database of medical concepts
- Create and manage nodes (symptoms, diagnoses, treatments)
- Build dynamic knowledge graphs for medical diagnostics
- Serve data to front-end visualization tools (e.g., Cytoscape.js)
- Process clinical notes using Large Language Models

## 🏗️ Architecture

- **Backend**: Node.js MCP Server on Google Cloud Run
- **Database**: Google Cloud SQL for PostgreSQL 17
- **Authentication**: Google Cloud IAM with service accounts
- **Secrets**: Google Secret Manager for secure credential storage
- **AI Integration**: Google Gemini API for medical text processing

## 🤖 Gemini AI Integration Features

### Intelligent Medical Text Processing
- **🧠 Concept Extraction**: Automatically extracts symptoms, diagnoses, treatments, anatomical parts, and risk factors from clinical text
- **📊 Knowledge Graph Generation**: Creates structured medical knowledge graphs in real-time
- **🩺 Diagnostic Insights**: Generates AI-powered diagnostic insights and recommendations
- **⚡ Real-time Processing**: Processes clinical notes and updates knowledge graphs instantly

### Interactive Experience
- **💬 Interactive Demo**: Chat-like interface for processing clinical cases
- **🎭 Demo Cases**: Pre-built clinical scenarios (cardiac, respiratory, neurological, orthopedic)
- **📈 Live Progress**: Real-time feedback during AI processing
- **📊 Knowledge Graph Stats**: View growing medical knowledge base

## 🛠️ Available Tools

### Database Management
- `test_db_connection`: Tests the PostgreSQL database connection
- `initialize_database`: Creates necessary tables and indexes
- `create_node`: Creates a new medical concept node (symptom, diagnosis, treatment)
- `get_node`: Retrieves a specific node by ID
- `list_nodes`: Lists all nodes with optional filtering by type
- `update_node`: Updates node labels and types
- `delete_node`: Removes a node from the database

### Cloud Run Deployment
- `deploy-file-contents`: Deploys files to Cloud Run by providing their contents directly
- `list-services`: Lists Cloud Run services in a given project and region
- `get-service`: Gets details for a specific Cloud Run service
- `get-service-log`: Gets logs and error messages for a specific Cloud Run service
- `deploy-local-files`*: Deploys files from the local file system to Cloud Run
- `deploy-local-folder`*: Deploys a local folder to Cloud Run
- `list-projects`*: Lists available GCP projects
- `create-project`*: Creates a new GCP project

_\* only available when running locally_

## 🚀 Setup Instructions

### Option A: Gemini AI Integration (Recommended)

**🤖 Full AI-Powered Medical Assistant with Gemini + MCP**

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Get Gemini API Key**
   - Visit https://aistudio.google.com/app/apikey
   - Create a new API key
   - Set environment variable:
   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```

3. **Quick Setup & Test**
   ```bash
   python setup_gemini.py
   ```

4. **Run Interactive Demo**
   ```bash
   python interactive_demo.py
   ```

5. **Or Run Automated Clinical Cases**
   ```bash
   python gemini_mcp_client.py
   ```

### Option B: MCP Server Only

**🔧 Backend Server for Custom AI Integrations**

1. **Install Dependencies**
   ```bash
   # Install Node.js (LTS version recommended)
   # Install Google Cloud SDK
   npm install
   ```

2. **Google Cloud Authentication**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Create Cloud SQL PostgreSQL Instance**
   ```bash
   gcloud sql instances create your-instance-name \
     --database-version=POSTGRES_17 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

4. **Create Database and User**
   ```bash
   gcloud sql databases create your-database-name --instance=your-instance-name
   gcloud sql users create your-username --instance=your-instance-name --password=your-password
   ```

### Environment Configuration

Set up the following environment variables in your Cloud Run service:

```bash
INSTANCE_CONNECTION_NAME=project-id:region:instance-name
DB_NAME=your-database-name
DB_USER=your-username
DB_PASS=your-password  # Store in Secret Manager
```

### Deployment

```bash
# Deploy to Cloud Run
gcloud run deploy mcp-server \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars INSTANCE_CONNECTION_NAME=your-connection-name \
  --set-env-vars DB_NAME=your-db-name \
  --set-env-vars DB_USER=your-db-user \
  --set-env-vars DB_PASS=your-db-password
```

## 🧪 Testing

Run the comprehensive test suite to verify functionality:

```bash
# Test PostgreSQL connection and all database operations
python test_postgresql_connection.py

# Test individual SQL functions
python test_sql_functions.py

# Test Gemini AI integration
python test_gemini_sql.py
```

## 📊 Database Schema

### Nodes Table
```sql
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,  -- 'Symptom', 'Diagnosis', 'Treatment', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships Table
```sql
CREATE TABLE relationships (
  id SERIAL PRIMARY KEY,
  source_node_id INTEGER NOT NULL,
  target_node_id INTEGER NOT NULL,
  relationship_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_node_id) REFERENCES nodes(id) ON DELETE CASCADE
);
```

## 🔧 Configuration Options

### Local Development

```json
"mcpServers": {
  "medical-assistant": {
    "command": "node",
    "args": ["mcp-server.js"]
  }
}
```

### Remote Server (Recommended for Production)

1. **Deploy with Authentication**
   ```bash
   gcloud run deploy mcp-server --source . --no-allow-unauthenticated
   ```

2. **Create Secure Proxy**
   ```bash
   gcloud run services proxy mcp-server --port=3000 --region=us-central1
   ```

3. **MCP Client Configuration**
   ```json
   "mcpServers": {
     "medical-assistant": {
       "url": "http://localhost:3000/sse"
     }
   }
   ```

## 🔐 Security Best Practices

- Store database passwords in Google Secret Manager
- Use IAM authentication for Cloud Run access
- Enable SSL connections to Cloud SQL
- Implement proper input validation for medical data
- Use VPC connectors for private database access

## 📈 Monitoring and Logging

- View Cloud Run logs: `gcloud logs read --service=mcp-server`
- Monitor database performance in Cloud SQL console
- Set up alerts for connection failures and performance issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with medical data
5. Submit a pull request

## 📄 License

Apache-2.0 License - see LICENSE file for details

## 🆘 Troubleshooting

### Connection Issues
- Verify Cloud SQL instance is running
- Check environment variables are set correctly
- Ensure service account has `roles/cloudsql.client` permission

### Database Issues
- Run `test_db_connection` to verify connectivity
- Check PostgreSQL logs in Cloud SQL console
- Verify database user permissions

### Deployment Issues
- Check Cloud Build logs for build errors
- Verify all dependencies are listed in package.json
- Ensure proper Cloud Run service configuration

For detailed troubleshooting, see `sql_connection_diagnostics.md`.

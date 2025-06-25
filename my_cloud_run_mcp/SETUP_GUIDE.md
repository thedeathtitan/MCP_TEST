# Medical Diagnostic Assistant Setup Guide

This guide walks you through setting up the complete Medical Diagnostic Assistant system from scratch.

## 📋 Prerequisites

### Required Software
- [Node.js](https://nodejs.org/) (LTS version 18+)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Python 3.8+](https://python.org/) (for testing scripts)
- [Git](https://git-scm.com/)

### Required Google Cloud APIs
Enable these APIs in your Google Cloud project:
```bash
gcloud services enable \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  servicenetworking.googleapis.com
```

## 🚀 Step-by-Step Setup

### Step 1: Google Cloud Project Setup

1. **Create or select a project**:
   ```bash
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   ```

2. **Enable billing** (required for Cloud SQL and Cloud Run):
   ```bash
   # List available billing accounts
   gcloud billing accounts list
   
   # Link project to billing account
   gcloud billing projects link your-project-id \
     --billing-account=YOUR_BILLING_ACCOUNT_ID
   ```

3. **Authenticate**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

### Step 2: PostgreSQL Database Setup

1. **Create Cloud SQL PostgreSQL instance**:
   ```bash
   gcloud sql instances create medical-assistant-db \
     --database-version=POSTGRES_17 \
     --tier=db-f1-micro \
     --region=us-central1 \
     --root-password=your-secure-password \
     --storage-size=10GB \
     --storage-type=SSD
   ```

2. **Create database**:
   ```bash
   gcloud sql databases create medical_knowledge \
     --instance=medical-assistant-db
   ```

3. **Create database user**:
   ```bash
   gcloud sql users create medical_user \
     --instance=medical-assistant-db \
     --password=user-secure-password
   ```

4. **Get connection name** (save this for later):
   ```bash
   gcloud sql instances describe medical-assistant-db \
     --format="value(connectionName)"
   ```

### Step 3: Secret Manager Configuration

1. **Store database password in Secret Manager**:
   ```bash
   echo -n "user-secure-password" | \
     gcloud secrets create db-password --data-file=-
   ```

2. **Grant Cloud Run access to secrets**:
   ```bash
   # Get your project number
   PROJECT_NUMBER=$(gcloud projects describe your-project-id --format="value(projectNumber)")
   
   # Grant secret access
   gcloud secrets add-iam-policy-binding db-password \
     --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

### Step 4: MCP Server Deployment

1. **Clone and setup the repository**:
   ```bash
   git clone <your-repo-url>
   cd medical-diagnostic-assistant
   npm install
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy mcp-server \
     --source . \
     --region=us-central1 \
     --allow-unauthenticated \
     --set-env-vars INSTANCE_CONNECTION_NAME="your-project-id:us-central1:medical-assistant-db" \
     --set-env-vars DB_NAME="medical_knowledge" \
     --set-env-vars DB_USER="medical_user" \
     --set-env-vars DB_PASS="user-secure-password" \
     --memory=512Mi \
     --cpu=1 \
     --max-instances=10
   ```

3. **Grant Cloud SQL access**:
   ```bash
   gcloud run services update mcp-server \
     --region=us-central1 \
     --add-cloudsql-instances=your-project-id:us-central1:medical-assistant-db
   ```

### Step 5: Service Account Configuration

1. **Grant Cloud SQL Client role**:
   ```bash
   gcloud projects add-iam-policy-binding your-project-id \
     --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
     --role="roles/cloudsql.client"
   ```

2. **Verify permissions**:
   ```bash
   gcloud projects get-iam-policy your-project-id \
     --flatten="bindings[].members" \
     --filter="bindings.role:roles/cloudsql.client"
   ```

### Step 6: Initialize Database Schema

1. **Run initialization test**:
   ```bash
   python test_postgresql_connection.py
   ```

2. **Or manually initialize via API**:
   ```bash
   curl -X POST "https://your-cloud-run-url/mcp" \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{
       "jsonrpc": "2.0",
       "method": "tools/call",
       "params": {
         "name": "initialize_database",
         "arguments": {}
       },
       "id": 1
     }'
   ```

## 🧪 Testing and Verification

### Quick Verification
```bash
# Test database connection
python test_postgresql_connection.py

# Test all SQL functions
python test_sql_functions.py

# Test with sample medical data
python test_gemini_sql.py
```

### Manual API Testing
```bash
# Test creating a medical node
curl -X POST "https://your-cloud-run-url/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "create_node",
      "arguments": {
        "label": "Chest Pain",
        "type": "Symptom"
      }
    },
    "id": 1
  }'
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `INSTANCE_CONNECTION_NAME` | Cloud SQL connection string | `project:region:instance` |
| `DB_NAME` | Database name | `medical_knowledge` |
| `DB_USER` | Database username | `medical_user` |
| `DB_PASS` | Database password | `secure-password` |
| `GEMINI_API_KEY` | Google AI API key (optional) | `AIza...` |

### Resource Sizing

#### Development (Low Cost)
```bash
gcloud run services update mcp-server \
  --memory=256Mi \
  --cpu=0.5 \
  --max-instances=3
```

#### Production (High Performance)
```bash
gcloud run services update mcp-server \
  --memory=1Gi \
  --cpu=2 \
  --max-instances=100 \
  --concurrency=80
```

## 🔐 Security Configuration

### Enable Private IP (Recommended for Production)

1. **Create VPC connector**:
   ```bash
   gcloud compute networks vpc-access connectors create medical-connector \
     --region=us-central1 \
     --subnet=default \
     --subnet-project=your-project-id \
     --min-instances=2 \
     --max-instances=3
   ```

2. **Update Cloud SQL for private IP**:
   ```bash
   gcloud sql instances patch medical-assistant-db \
     --network=default \
     --no-assign-ip
   ```

3. **Update Cloud Run to use VPC connector**:
   ```bash
   gcloud run services update mcp-server \
     --vpc-connector=medical-connector \
     --vpc-egress=private-ranges-only
   ```

### SSL/TLS Configuration
```bash
# Enable SSL on Cloud SQL
gcloud sql instances patch medical-assistant-db \
  --require-ssl

# Create client certificates (if needed)
gcloud sql ssl-certs create medical-client-cert \
  --instance=medical-assistant-db
```

## 📊 Monitoring Setup

### Cloud Monitoring
```bash
# Create uptime check
gcloud monitoring uptime create-http \
  --display-name="Medical Assistant Health Check" \
  --hostname="your-cloud-run-url" \
  --path="/health"
```

### Logging
```bash
# View Cloud Run logs
gcloud logs read "resource.type=cloud_run_revision" \
  --filter="resource.labels.service_name=mcp-server" \
  --limit=50

# View Cloud SQL logs
gcloud logs read "resource.type=cloudsql_database" \
  --filter="resource.labels.database_id=your-project-id:medical-assistant-db" \
  --limit=50
```

## 🚨 Troubleshooting

### Common Issues

#### Connection Timeout
```bash
# Check Cloud SQL instance status
gcloud sql instances describe medical-assistant-db

# Verify service account permissions
gcloud projects get-iam-policy your-project-id
```

#### Database Access Issues
```bash
# Test database connectivity
gcloud sql connect medical-assistant-db --user=medical_user

# Check Cloud Run environment variables
gcloud run services describe mcp-server --region=us-central1
```

#### Deployment Failures
```bash
# Check Cloud Build logs
gcloud logging read "resource.type=build" --limit=10

# Verify enabled APIs
gcloud services list --enabled
```

## 🔄 Maintenance

### Database Backup
```bash
# Create automated backup
gcloud sql backups create \
  --instance=medical-assistant-db \
  --description="Manual backup before update"
```

### Update Deployment
```bash
# Redeploy with latest code
gcloud run deploy mcp-server \
  --source . \
  --region=us-central1
```

### Scale Management
```bash
# Scale up for high traffic
gcloud run services update mcp-server \
  --max-instances=50

# Scale down for cost optimization
gcloud run services update mcp-server \
  --max-instances=5
```

## 📚 Additional Resources

- [Cloud SQL for PostgreSQL Documentation](https://cloud.google.com/sql/docs/postgres)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Medical Terminology Standards](https://www.nlm.nih.gov/research/umls/)

## 🆘 Support

For issues related to:
- **Infrastructure**: Check Google Cloud Console and logs
- **Database**: Verify connections and review PostgreSQL logs
- **Application**: Run test scripts and check Cloud Run logs
- **Medical Data**: Validate against medical terminology standards

Remember to follow HIPAA compliance guidelines if handling real patient data. 
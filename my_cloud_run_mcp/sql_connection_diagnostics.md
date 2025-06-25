# Cloud SQL Connection Timeout Diagnostics

## Current Status
- ✅ MCP Server is running and responsive
- ✅ SQL tools are registered and available
- ✅ Cloud SQL Connector is properly configured in code
- ❌ Database connections are timing out with `ETIMEDOUT`

## Error Pattern
All SQL operations return: `connect ETIMEDOUT`

This indicates the Cloud SQL Connector is working (finding the instance) but timing out during the actual connection establishment.

## Common Causes for ETIMEDOUT from Cloud Run to Cloud SQL

### 1. VPC Connector Issues (Most Likely)
If using private IP connection:
- Cloud Run service may not be properly connected to VPC connector
- VPC connector may not be configured correctly
- VPC connector may be in wrong region/network

### 2. Cloud SQL Configuration Issues
- SQL instance may be in different region than Cloud Run service
- SQL instance may have restricted authorized networks
- SQL instance may be paused/stopped
- SSL enforcement settings may be blocking connections

### 3. Service Account Permissions
- Cloud Run service account may lack `roles/cloudsql.client` permission
- Service account may not have access to the specific SQL instance

### 4. Environment Variables
- `INSTANCE_CONNECTION_NAME` format issues
- Missing or incorrect database credentials
- Wrong database name

### 5. Network/Firewall Issues
- Google Cloud firewall rules blocking connection
- VPC firewall rules if using private IP
- Regional connectivity issues

## Diagnostic Steps to Try

### 1. Check Cloud Run Service Configuration
```bash
gcloud run services describe mcp-server --region=us-central1 --platform=managed
```

Look for:
- VPC connector configuration (if using private IP)
- Cloud SQL connections
- Environment variables

### 2. Check Cloud SQL Instance Status
```bash
gcloud sql instances describe luminous-lodge-463714-d9:us-central1:initial
```

Look for:
- Instance state (should be RUNNABLE)
- Network configuration (public/private IP)
- Region (should match Cloud Run region)

### 3. Check Service Account Permissions
```bash
gcloud projects get-iam-policy PROJECT_ID --flatten="bindings[].members" --format='table(bindings.role)' --filter="bindings.members:*@PROJECT_ID.iam.gserviceaccount.com"
```

### 4. Test Connection from Cloud Shell
If your SQL instance has public IP:
```bash
gcloud sql connect luminous-lodge-463714-d9:us-central1:initial --user=DB_USER
```

### 5. Check Cloud Run Logs for Detailed Errors
```bash
gcloud logs read --resource-names="cloud_run_revision" --filter="resource.labels.service_name=mcp-server" --limit=50
```

Look for:
- Detailed connector error messages
- Environment variable loading
- SSL/TLS negotiation errors
- Timeout values and connection attempts

## Configuration Recommendations

### If Using Public IP (Current Setup)
1. Ensure Cloud Run service has Cloud SQL connection configured
2. Verify service account has cloudsql.client role
3. Check if SQL instance allows connections from Cloud Run's IP range

### If Switching to Private IP (Recommended for Production)
1. Create VPC connector in same region as Cloud SQL instance
2. Configure Cloud Run to route traffic through VPC connector
3. Update connection code to use private IP directly
4. Remove Cloud SQL Auth Proxy configuration

## Next Steps for You
1. Check Cloud Run service logs in Google Cloud Console
2. Verify SQL instance is running and in correct region
3. Confirm environment variables are set correctly
4. Test SQL connection from Cloud Shell
5. Consider switching to private IP connection method

## Code Analysis
The current connection code is correctly using Cloud SQL Connector, so the issue is likely infrastructure/configuration related rather than code-related. 
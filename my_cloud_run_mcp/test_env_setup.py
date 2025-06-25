#!/usr/bin/env python3
"""
Test script to verify Cloud SQL setup and provide diagnostic information
"""

import os
import subprocess
import json

def run_gcloud_command(cmd):
    """Run a gcloud command and return the output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            return f"Error: {result.stderr.strip()}"
    except Exception as e:
        return f"Exception: {e}"

def check_cloud_sql_instance():
    """Check Cloud SQL instance status"""
    print("=== CLOUD SQL INSTANCE STATUS ===")
    
    cmd = "gcloud sql instances describe initial --format=json"
    output = run_gcloud_command(cmd)
    
    try:
        instance_info = json.loads(output)
        print(f"Instance State: {instance_info.get('state', 'UNKNOWN')}")
        print(f"Database Version: {instance_info.get('databaseVersion', 'UNKNOWN')}")
        print(f"Region: {instance_info.get('region', 'UNKNOWN')}")
        
        # Check IP addresses
        ip_addresses = instance_info.get('ipAddresses', [])
        for ip in ip_addresses:
            print(f"IP Address ({ip.get('type', 'UNKNOWN')}): {ip.get('ipAddress', 'UNKNOWN')}")
            
        # Check backend type
        backend_type = instance_info.get('backendType', 'UNKNOWN')
        print(f"Backend Type: {backend_type}")
        
        # Check settings
        settings = instance_info.get('settings', {})
        tier = settings.get('tier', 'UNKNOWN')
        availability_type = settings.get('availabilityType', 'UNKNOWN')
        print(f"Tier: {tier}")
        print(f"Availability Type: {availability_type}")
        
    except json.JSONDecodeError:
        print(f"Failed to parse instance info: {output}")

def check_cloud_run_service():
    """Check Cloud Run service configuration"""
    print("\n=== CLOUD RUN SERVICE STATUS ===")
    
    cmd = "gcloud run services describe mcp-server --region=us-central1 --format=json"
    output = run_gcloud_command(cmd)
    
    try:
        service_info = json.loads(output)
        
        # Check service status
        status = service_info.get('status', {})
        print(f"Service URL: {status.get('url', 'UNKNOWN')}")
        
        # Check revision template
        spec = service_info.get('spec', {})
        template = spec.get('template', {})
        spec_template = template.get('spec', {})
        
        # Check containers and environment variables
        containers = spec_template.get('containers', [])
        if containers:
            container = containers[0]
            env_vars = container.get('env', [])
            
            print("\nEnvironment Variables:")
            sql_related_vars = ['INSTANCE_CONNECTION_NAME', 'DB_NAME', 'DB_USER', 'DB_PASS']
            for var in env_vars:
                var_name = var.get('name', '')
                if var_name in sql_related_vars:
                    if var_name == 'DB_PASS':
                        print(f"  {var_name}: [SET]")
                    else:
                        print(f"  {var_name}: {var.get('value', 'NOT SET')}")
            
            # Check annotations for Cloud SQL connections
            annotations = template.get('metadata', {}).get('annotations', {})
            cloud_sql_instances = annotations.get('run.googleapis.com/cloudsql-instances', '')
            if cloud_sql_instances:
                print(f"\nCloud SQL Instances: {cloud_sql_instances}")
            else:
                print("\nNo Cloud SQL instances configured")
                
            # Check VPC connector
            vpc_access = annotations.get('run.googleapis.com/vpc-access-connector', '')
            if vpc_access:
                print(f"VPC Access Connector: {vpc_access}")
            else:
                print("No VPC Access Connector configured")
                
    except json.JSONDecodeError:
        print(f"Failed to parse service info: {output}")

def check_service_account_permissions():
    """Check service account permissions"""
    print("\n=== SERVICE ACCOUNT PERMISSIONS ===")
    
    # Get project ID
    project_cmd = "gcloud config get-value project"
    project_id = run_gcloud_command(project_cmd)
    
    if not project_id.startswith("Error"):
        # Check IAM policy for Cloud SQL client role
        cmd = f'gcloud projects get-iam-policy {project_id} --flatten="bindings[].members" --format="table(bindings.role,bindings.members)" --filter="bindings.role:roles/cloudsql.client"'
        output = run_gcloud_command(cmd)
        print(f"Cloud SQL Client Role Bindings:\n{output}")
    else:
        print(f"Could not get project ID: {project_id}")

def main():
    """Main diagnostic function"""
    print("CLOUD SQL CONNECTION DIAGNOSTICS")
    print("="*50)
    
    check_cloud_sql_instance()
    check_cloud_run_service()
    check_service_account_permissions()
    
    print("\n=== RECOMMENDATIONS ===")
    print("1. Verify your SQL instance is in RUNNABLE state")
    print("2. Ensure Cloud Run service has Cloud SQL connection configured")
    print("3. Check that service account has cloudsql.client role")
    print("4. Review environment variables are properly set")
    print("5. Check Cloud Run logs for detailed error messages:")
    print("   gcloud logs read --resource='cloud_run_revision' --filter='resource.labels.service_name=mcp-server' --limit=20")

if __name__ == "__main__":
    main() 
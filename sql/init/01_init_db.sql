-- =============================================
-- Database Initialization Script
-- =============================================
-- This script runs when the PostgreSQL container starts
-- It sets up the basic database structure before Flyway migrations

-- Ensure the database exists (Docker Compose should handle this)
-- CREATE DATABASE mcp_diagnostics;

-- Set up basic database configuration
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Create a schema for application data
CREATE SCHEMA IF NOT EXISTS app_data;
CREATE SCHEMA IF NOT EXISTS audit_log;

-- Grant permissions to the application user
GRANT USAGE ON SCHEMA public TO mcp_user;
GRANT USAGE ON SCHEMA app_data TO mcp_user;
GRANT CREATE ON SCHEMA public TO mcp_user;
GRANT CREATE ON SCHEMA app_data TO mcp_user;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create a simple health check function
CREATE OR REPLACE FUNCTION health_check() 
RETURNS TABLE(status text, timestamp timestamptz) 
LANGUAGE sql 
AS $$
    SELECT 'healthy'::text, now()::timestamptz;
$$;

-- Grant execute permission on health check function
GRANT EXECUTE ON FUNCTION health_check() TO mcp_user; 
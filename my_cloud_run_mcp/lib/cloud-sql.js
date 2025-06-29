/*
Copyright 2025 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Connector } from "@google-cloud/cloud-sql-connector";
import pg from 'pg';
const { Client } = pg;

const connector = new Connector();

/**
 * Creates a connection to Cloud SQL using the Cloud SQL Connector (production)
 * or direct PostgreSQL connection (local development)
 */
async function createConnection() {
  // Check if we have Cloud SQL configuration (production)
  if (process.env.INSTANCE_CONNECTION_NAME && process.env.DB_USER) {
    console.log('Using Cloud SQL Connector for production database');
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
      ipType: 'PUBLIC',
    });

    const client = new Client({
      ...clientOpts,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    await client.connect();
    return client;
  }
  
  // Check if we have DATABASE_URL (local development or other environments)
  if (process.env.DATABASE_URL) {
    console.log('Using direct PostgreSQL connection for local development');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    return client;
  }

  // Fallback to individual environment variables
  if (process.env.POSTGRES_HOST) {
    console.log('Using individual PostgreSQL environment variables');
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT || 5432,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    });

    await client.connect();
    return client;
  }

  throw new Error('No database configuration found. Please set either INSTANCE_CONNECTION_NAME + DB_USER or DATABASE_URL or POSTGRES_HOST + POSTGRES_USER');
}

/**
 * Initializes the database tables if they don't exist
 */
export async function initializeDatabase() {
  const connection = await createConnection();
  
  try {
    // Create nodes table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS nodes (
        id SERIAL PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type)
    `);
    
    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_nodes_label ON nodes(label)
    `);

    // Create relationships table if it doesn't exist (for future use)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS relationships (
        id SERIAL PRIMARY KEY,
        source_node_id INTEGER NOT NULL,
        target_node_id INTEGER NOT NULL,
        relationship_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (target_node_id) REFERENCES nodes(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for relationships
    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_node_id)
    `);
    
    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_node_id)
    `);
    
    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type)
    `);

    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Creates a new node in the database
 * @param {string} label - The label/name of the node
 * @param {string} type - The type of the node (e.g., 'Symptom', 'Diagnosis', 'Treatment')
 * @returns {Promise<Object>} The created node with its ID
 */
export async function createNode(label, type) {
  if (!label || !type) {
    throw new Error('Label and type are required');
  }

  const connection = await createConnection();
  
  try {
    const result = await connection.query(
      'INSERT INTO nodes (label, type) VALUES ($1, $2) RETURNING *',
      [label, type]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating node:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Deletes a node from the database
 * @param {number} nodeId - The ID of the node to delete
 * @returns {Promise<boolean>} True if the node was deleted, false if not found
 */
export async function deleteNode(nodeId) {
  if (!nodeId) {
    throw new Error('Node ID is required');
  }

  const connection = await createConnection();
  
  try {
    const result = await connection.query(
      'DELETE FROM nodes WHERE id = $1',
      [nodeId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting node:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Gets a node by ID
 * @param {number} nodeId - The ID of the node to retrieve
 * @returns {Promise<Object|null>} The node object or null if not found
 */
export async function getNode(nodeId) {
  if (!nodeId) {
    throw new Error('Node ID is required');
  }

  const connection = await createConnection();
  
  try {
    const result = await connection.query(
      'SELECT * FROM nodes WHERE id = $1',
      [nodeId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting node:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Lists all nodes, optionally filtered by type
 * @param {string} type - Optional type filter
 * @param {number} limit - Optional limit (default 100)
 * @returns {Promise<Array>} Array of node objects
 */
export async function listNodes(type = null, limit = 100) {
  const connection = await createConnection();
  
  try {
    let query = 'SELECT * FROM nodes';
    let params = [];

    if (type) {
      query += ' WHERE type = $1';
      params.push(type);
      query += ' ORDER BY created_at DESC LIMIT $2';
      params.push(limit);
    } else {
      query += ' ORDER BY created_at DESC LIMIT $1';
      params.push(limit);
    }

    const result = await connection.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error listing nodes:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Updates a node's label and/or type
 * @param {number} nodeId - The ID of the node to update
 * @param {string} label - New label (optional)
 * @param {string} type - New type (optional)
 * @returns {Promise<Object|null>} The updated node or null if not found
 */
export async function updateNode(nodeId, label = null, type = null) {
  if (!nodeId) {
    throw new Error('Node ID is required');
  }

  if (!label && !type) {
    throw new Error('At least one of label or type must be provided');
  }

  const connection = await createConnection();
  
  try {
    let setParts = [];
    let params = [];
    let paramIndex = 1;

    if (label) {
      setParts.push(`label = $${paramIndex}`);
      params.push(label);
      paramIndex++;
    }

    if (type) {
      setParts.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    params.push(nodeId);

    const result = await connection.query(
      `UPDATE nodes SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating node:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Tests the database connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export async function testConnection() {
  try {
    const connection = await createConnection();
    await connection.query('SELECT 1 as test');
    await connection.end();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
} 
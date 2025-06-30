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

import { z } from "zod";
import { deploy } from './lib/cloud-run-deploy.js';
import { listServices, getService, getServiceLogs } from './lib/cloud-run-services.js';
import { listProjects, createProjectAndAttachBilling } from './lib/gcp-projects.js';
import { checkGCP } from './lib/gcp-metadata.js';
import { 
  initializeDatabase, 
  createNode, 
  deleteNode, 
  getNode, 
  listNodes, 
  updateNode, 
  testConnection,
  createOrUpdateSession,
  recordInteraction,
  recordDiagnosisHistory,
  getSessionHistory
} from './lib/cloud-sql.js';
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

export const registerTools = (server) => {
  // === DATABASE TOOLS ===
  
  // Tool to test database connection
  server.tool(
    "test_db_connection",
    "Tests the connection to the Cloud SQL database",
    async () => {
      try {
        const isConnected = await testConnection();
        return {
          content: [{
            type: 'text',
            text: isConnected ? 
              '✅ Database connection successful!' : 
              '❌ Database connection failed!'
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Database connection error: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to initialize database tables
  server.tool(
    "initialize_database",
    "Initializes the database tables (nodes and relationships)",
    async () => {
      try {
        await initializeDatabase();
        return {
          content: [{
            type: 'text',
            text: '✅ Database tables initialized successfully!'
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Database initialization error: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to create a new node
  server.tool(
    "create_node",
    "Creates a new node in the medical knowledge graph",
    {
      label: z.string().describe("The text/label for the node (e.g., 'sore throat', 'strep throat')"),
      type: z.string().describe("The type of the node (e.g., 'Symptom', 'Diagnosis', 'Treatment', 'Test')")
    },
    async ({ label, type }) => {
      try {
        const node = await createNode(label, type);
        return {
          content: [{
            type: 'text',
            text: `✅ Created node successfully!\nID: ${node.id}\nLabel: ${node.label}\nType: ${node.type}\nCreated: ${node.created_at}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error creating node: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to delete a node
  server.tool(
    "delete_node",
    "Deletes a node from the database by its ID",
    {
      nodeId: z.number().describe("The ID of the node to delete")
    },
    async ({ nodeId }) => {
      try {
        const deleted = await deleteNode(nodeId);
        return {
          content: [{
            type: 'text',
            text: deleted ? 
              `✅ Node ${nodeId} deleted successfully!` : 
              `❌ Node ${nodeId} not found!`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error deleting node: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to get a specific node
  server.tool(
    "get_node",
    "Retrieves a specific node by its ID",
    {
      nodeId: z.number().describe("The ID of the node to retrieve")
    },
    async ({ nodeId }) => {
      try {
        const node = await getNode(nodeId);
        if (node) {
          return {
            content: [{
              type: 'text',
              text: `📋 Node Details:\nID: ${node.id}\nLabel: ${node.label}\nType: ${node.type}\nCreated: ${node.created_at}\nUpdated: ${node.updated_at}`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `❌ Node ${nodeId} not found!`
            }]
          };
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error retrieving node: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to list nodes
  server.tool(
    "list_nodes",
    "Lists all nodes, optionally filtered by type",
    {
      type: z.string().optional().describe("Optional filter by node type (e.g., 'Symptom', 'Diagnosis')"),
      limit: z.number().optional().default(20).describe("Maximum number of nodes to return (default: 20)")
    },
    async ({ type, limit = 20 }) => {
      try {
        const nodes = await listNodes(type, limit);
        if (nodes.length === 0) {
          return {
            content: [{
              type: 'text',
              text: type ? 
                `📋 No nodes found with type "${type}"` : 
                '📋 No nodes found in database'
            }]
          };
        }

        const nodeList = nodes.map(node => 
          `• ID: ${node.id} | "${node.label}" (${node.type}) | Created: ${node.created_at}`
        ).join('\n');

        const filterText = type ? ` (filtered by type: ${type})` : '';
        return {
          content: [{
            type: 'text',
            text: `📋 Found ${nodes.length} nodes${filterText}:\n\n${nodeList}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error listing nodes: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to update a node
  server.tool(
    "update_node",
    "Updates a node's label and/or type",
    {
      nodeId: z.number().describe("The ID of the node to update"),
      label: z.string().optional().describe("New label for the node"),
      type: z.string().optional().describe("New type for the node")
    },
    async ({ nodeId, label, type }) => {
      try {
        const node = await updateNode(nodeId, label, type);
        if (node) {
          return {
            content: [{
              type: 'text',
              text: `✅ Node updated successfully!\nID: ${node.id}\nLabel: ${node.label}\nType: ${node.type}\nUpdated: ${node.updated_at}`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `❌ Node ${nodeId} not found!`
            }]
          };
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error updating node: ${error.message}`
          }]
        };
      }
    }
  );

  // === EXISTING GCP TOOLS ===
  
  // Tool to list GCP projects
  server.tool(
    "list_projects",
    "Lists available GCP projects",
    async () => {
      try {
        const projects = await listProjects();
        return {
          content: [{
            type: 'text',
            text: `Available GCP Projects:\n${projects.map(p => `- ${p.id}`).join('\n')}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error listing GCP projects: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to create a new GCP project
  server.tool(
    "create_project",
    "Creates a new GCP project and attempts to attach it to the first available billing account. A project ID can be optionally specified; otherwise it will be automatically generated.",
    {
      projectId: z.string().optional().describe("Optional. The desired ID for the new GCP project. If not provided, an ID will be auto-generated."),
    },
    async ({ projectId }) => {
      if (projectId !== undefined && (typeof projectId !== 'string' || projectId.trim() === '')) {
        return {
          content: [{
            type: 'text',
            text: "Error: If provided, Project ID must be a non-empty string."
          }]
        };
      }
      try {
        const result = await createProjectAndAttachBilling(projectId);
        return {
          content: [{
            type: 'text',
            text: `Successfully created GCP project with ID "${newProjectId}". You can now use this project ID for deployments.`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error creating GCP project or attaching billing: ${error.message}`
          }]
        };
      }
    }
  );

  // Listing Cloud Run services
  server.tool(
    "list_services",
    "Lists Cloud Run services in a given project and region.",
    {
      project: z.string().describe("Google Cloud project ID"),
      region: z.string().describe("Region where the services are located").default('europe-west1'),
    },
    async ({ project, region }) => {
      if (typeof project !== 'string') {
        return { content: [{ type: 'text', text: "Error: Project ID must be provided and be a non-empty string." }] };
      }

      try {
        const services = await listServices(project, region);
        const serviceList = services.map(s => {
          const serviceName = s.name.split('/').pop();
          return `- ${serviceName} (URL: ${s.uri})`;
        }).join('\n');
        return {
          content: [{
            type: 'text',
            text: `Services in project ${project} (location ${region}):\n${serviceList}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error listing services for project ${project} (region ${region}): ${error.message}`
          }]
        };
      }
    }
  );

  // Dynamic resource for getting a specific service
  server.tool(
    "get_service",
    "Gets details for a specific Cloud Run service.",
    {
      project: z.string().describe("Google Cloud project ID containing the service"),
      region: z.string().describe("Region where the service is located").default('europe-west1'),
      service: z.string().describe("Name of the Cloud Run service"),
    },
    async ({ project, region, service }) => {
      if (typeof project !== 'string') {
        return { content: [{ type: 'text', text: "Error: Project ID must be provided." }] };
      }
      if (typeof service !== 'string') {
        return { content: [{ type: 'text', text: "Error: Service name must be provided." }] };
      }
      try {
        const serviceDetails = await getService(project, region, service);
        if (serviceDetails) {
          return {
            content: [{
              type: 'text',
              text: `Name: ${service}\nRegion: ${region}\nProject: ${project}\nURL: ${serviceDetails.uri}\nLast deployed by: ${serviceDetails.lastModifier}`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `Service ${service} not found in project ${project} (region ${region}).`
            }]
          };
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error getting service ${service} in project ${project} (region ${region}): ${error.message}`
          }]
        };
      }
    }
  );

  // Logs for a service
  server.tool(
    "get_service_log",
    "Gets Logs and Error Messages for a specific Cloud Run service.",
    {
      project: z.string().describe("Google Cloud project ID containing the service"),
      region: z.string().describe("Region where the service is located").default('europe-west1'),
      service: z.string().describe("Name of the Cloud Run service"),
    },
    async ({ project, region, service }) => {
      let allLogs = [];
      let requestOptions;
      try {
        do {
          // Fetch a page of logs
          const response = await getServiceLogs(project, region, service, requestOptions);
          
          if (response.logs) {
            allLogs.push(response.logs);
          }
          
          // Set the requestOptions incl pagintion token for the next iteration

          requestOptions = response.requestOptions;

        } while (requestOptions); // Continue as long as there is a next page token
          return {
            content: [{
              type: 'text',
              text: allLogs.join('\n')
            }]
          };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error getting Logs for service ${service} in project ${project} (region ${region}): ${error.message}`
          }]
        };
      }
    }
  );

  server.tool(
    'deploy_local_files',
    'Deploy local files to Cloud Run. Takes an array of absolute file paths from the local filesystem that will be deployed. Use this tool if the files exists on the user local filesystem.',
    {
      project: z.string().describe('Google Cloud project ID. Do not select it yourself, make sure the user provides or confirms the project ID.'),
      region: z.string().optional().default('europe-west1').describe('Region to deploy the service to'),
      service: z.string().optional().default('app').describe('Name of the Cloud Run service to deploy to'),
      files: z.array(z.string()).describe('Array of absolute file paths to deploy (e.g. ["/home/user/project/src/index.js", "/home/user/project/package.json"])'),
    },
    async ({ project, region, service, files }) => {
      if (typeof project !== 'string') {
        throw new Error('Project must specified, please prompt the user for a valid existing Google Cloud project ID.');
      }
      if (typeof files !== 'object' || !Array.isArray(files)) {
        throw new Error('Files must specified');
      }
      if (files.length === 0) {
        throw new Error('No files specified for deployment');
      }

      // Deploy to Cloud Run
      try {
        // TODO: Should we return intermediate progress messages? we'd need to use sendNotification for that, see https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/examples/server/jsonResponseStreamableHttp.ts#L46C24-L46C41
        const response = await deploy({
          projectId: project,
          serviceName: service,
          region: region,
          files: files,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Cloud Run service ${service} deployed in project ${project}\nCloud Console: https://console.cloud.google.com/run/detail/${region}/${service}?project=${project}\nService URL: ${response.uri}`,
            }
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deploying to Cloud Run: ${error.message || error}`,
            }
          ],
        };
      }
    });


  server.tool(
    'deploy_local_folder',
    'Deploy a local folder to Cloud Run. Takes an absolute folder path from the local filesystem that will be deployed. Use this tool if the entire folder content needs to be deployed.',
    {
      project: z.string().describe('Google Cloud project ID. Do not select it yourself, make sure the user provides or confirms the project ID.'),
      region: z.string().optional().default('europe-west1').describe('Region to deploy the service to'),
      service: z.string().optional().default('app').describe('Name of the Cloud Run service to deploy to'),
      folderPath: z.string().describe('Absolute path to the folder to deploy (e.g. "/home/user/project/src")'),
    },
    async ({ project, region, service, folderPath }) => {
      if (typeof project !== 'string') {
        throw new Error('Project must be specified, please prompt the user for a valid existing Google Cloud project ID.');
      }
      if (typeof folderPath !== 'string' || folderPath.trim() === '') {
        throw new Error('Folder path must be specified and be a non-empty string.');
      }

      // Deploy to Cloud Run
      try {
        const response = await deploy({
          projectId: project,
          serviceName: service,
          region: region,
          files: [folderPath], // Pass the folder path as a single item in an array
        });
        return {
          content: [
            {
              type: 'text',
              text: `Cloud Run service ${service} deployed from folder ${folderPath} in project ${project}\nCloud Console: https://console.cloud.google.com/run/detail/${region}/${service}?project=${project}\nService URL: ${response.uri}`,
            }
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deploying folder to Cloud Run: ${error.message || error}`,
            }
          ],
        };
      }
    }
  );

  server.tool(
    'deploy_file_contents',
    'Deploy files to Cloud Run by providing their contents directly. Takes an array of file objects containing filename and content. Use this tool if the files only exist in the current chat context.',
    {
      project: z.string().describe('Google Cloud project ID. Leave unset for the app to be deployed in a new project. If provided, make sure the user confirms the project ID they want to deploy to.'),
      region: z.string().optional().default('europe-west1').describe('Region to deploy the service to'),
      service: z.string().optional().default('app').describe('Name of the Cloud Run service to deploy to'),
      files: z.array(z.object({
        filename: z.string().describe('Name and path of the file (e.g. "src/index.js" or "data/config.json")'),
        content: z.string().optional().describe('Text content of the file'),
      })).describe('Array of file objects containing filename and content'),
    },
    async ({ project, region, service, files }) => {
      if (typeof project !== 'string') {
        throw new Error('Project must specified, please prompt the user for a valid existing Google Cloud project ID.');
      }
      if (typeof files !== 'object' || !Array.isArray(files)) {
        throw new Error('Files must be specified');
      }
      if (files.length === 0) {
        throw new Error('No files specified for deployment');
      }

      // Validate that each file has either content
      for (const file of files) {
        if (!file.content) {
          throw new Error(`File ${file.filename} must have content`);
        }
      }

      // Deploy to Cloud Run
      try {
        const response = await deploy({
          projectId: project,
          serviceName: service,
          region: region,
          files: files,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Cloud Run service ${service} deployed in project ${project}\nCloud Console: https://console.cloud.google.com/run/detail/${region}/${service}?project=${project}\nService URL: ${response.uri}`,
            }
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deploying to Cloud Run: ${error.message || error}`,
            }
          ],
        };
      }
    });

  // === COMPREHENSIVE MEDICAL ANALYSIS TOOL ===
  
  // Tool for comprehensive medical analysis - this is what the frontend expects
  server.tool(
    "analyze_medical_note",
    "Performs comprehensive medical analysis of clinical notes with differential diagnosis, next actions, and problem list generation",
    {
      clinical_note: z.string().describe("The clinical note or patient presentation to analyze"),
      api_key: z.string().optional().describe("Optional Gemini API key for enhanced AI analysis"),
      session_id: z.string().optional().describe("Optional session ID for tracking user interactions")
    },
    async ({ clinical_note, api_key, session_id }) => {
      const startTime = Date.now();
      
      try {
        console.log('🔄 Starting comprehensive medical analysis...');
        console.log('📄 Clinical note length:', clinical_note.length);
        
        // Generate session ID if not provided
        const sessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        // Track session for history
        console.log('📊 Creating/updating user session:', sessionId);
        await createOrUpdateSession(sessionId, 'api_user');
        
                  // Import OpenAI client for AI analysis
          const OpenAI = (await import('openai')).default;
        
        // Use provided API key or fall back to environment variable
        const openaiApiKey = api_key || process.env.OPENAI_API_KEY;
        
        if (!openaiApiKey) {
          throw new Error('OpenAI API key required for medical analysis. Please provide via api_key parameter or OPENAI_API_KEY environment variable.');
        }

        const openai = new OpenAI({ apiKey: openaiApiKey });
        const model = 'o3-mini';

        // Comprehensive medical analysis prompt
        const medicalPrompt = `You are an expert emergency medicine physician. Analyze this clinical presentation and provide a comprehensive medical assessment.

CLINICAL PRESENTATION:
${clinical_note}

Provide a comprehensive JSON response with the following structure:

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
          "evidence": ["S3 gallop", "bilateral crackles", "elevated JVP", "orthopnea"],
          "details": "Clinical presentation strongly suggests acute decompensated heart failure with fluid overload",
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
      "details": "Assess for pulmonary edema and cardiomegaly",
      "category": "diagnostic",
      "timing": "STAT",
      "related_diagnosis_id": "dx_1"
    }
  ],
  "relationships": [
    {
      "id": "rel_1",
      "source": "dx_1",
      "target": "action_1", 
      "relationship": "investigates",
      "label": "confirms diagnosis",
      "strength": "strong"
    }
  ],
  "problem_list": [
    {
      "id": "prob_1",
      "diagnosis": "Acute Heart Failure",
      "icd10Code": "I50.9",
      "likelihood": 0.9,
      "category": "cardiac",
      "evidence": ["S3 gallop", "bilateral crackles"],
      "status": "active"
    }
  ]
}

Requirements:
- Provide 3-5 diagnosis groups with 1-3 diagnoses each
- Include 5-10 next actions (diagnostic, therapeutic, monitoring)
- Create comprehensive relationships between diagnoses and actions
- Generate accurate ICD-10 codes for problem list
- Use clinical reasoning based on presented evidence
- Prioritize actions appropriately (urgent/high/medium/low)
- Return valid JSON only, no additional text`;

        console.log('🤖 Calling OpenAI O3-mini for medical analysis...');
        const result = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system", 
              content: "You are an expert emergency medicine physician. Analyze clinical presentations and provide comprehensive medical assessments in the exact JSON format requested. Return only valid JSON, no additional text."
            },
            {
              role: "user",
              content: medicalPrompt
            }
          ],
          max_completion_tokens: 8000
        });
        const jsonText = result.choices[0].message.content;
        
        console.log('📄 Raw OpenAI O3-mini response:', jsonText.substring(0, 200) + '...');
        
        // Clean and parse JSON response
        let cleanJson = jsonText.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        const aiAnalysis = JSON.parse(cleanJson);
        console.log('✅ AI analysis parsed successfully');
        
        // Store comprehensive results in database
        console.log('💾 Storing analysis results in PostgreSQL...');
        const createdNodes = [];
        const createdRelationships = [];
        
        // Store diagnosis nodes
        for (const group of aiAnalysis.diagnosis_groups) {
          for (const diagnosis of group.diagnoses) {
            const node = await createNode(diagnosis.label, diagnosis.type);
            createdNodes.push({
              ...node,
              originalId: diagnosis.id,
              likelihood: diagnosis.likelihood,
              confidence: diagnosis.confidence,
              evidence: diagnosis.evidence,
              details: diagnosis.details,
              category: diagnosis.category
            });
          }
        }
        
        // Store action nodes
        for (const action of aiAnalysis.next_actions) {
          const node = await createNode(action.label, action.type);
          createdNodes.push({
            ...node,
            originalId: action.id,
            priority: action.priority,
            details: action.details,
            category: action.category,
            timing: action.timing,
            related_diagnosis_id: action.related_diagnosis_id
          });
        }
        
        console.log(`📊 Created ${createdNodes.length} nodes in database`);
        
        // Transform for frontend consumption
        const frontendResponse = {
          session_id: sessionId,
          nodes: createdNodes.map(node => ({
            id: node.originalId || node.id.toString(),
            label: node.label,
            type: node.type,
            likelihood: node.likelihood || 0.5,
            confidence: node.confidence || 0.5,
            evidence: node.evidence || [],
            details: node.details || '',
            category: node.category || 'general',
            priority: node.priority || 'medium',
            timing: node.timing || '',
            related_diagnosis_id: node.related_diagnosis_id || ''
          })),
          edges: aiAnalysis.relationships.map(rel => ({
            id: rel.id,
            source: rel.source,
            target: rel.target,
            relationship: rel.relationship,
            label: rel.label,
            strength: rel.strength
          })),
          problemList: aiAnalysis.problem_list.map(problem => ({
            id: problem.id,
            diagnosis: problem.diagnosis,
            icd10Code: problem.icd10Code,
            likelihood: problem.likelihood,
            category: problem.category,
            evidence: problem.evidence,
            status: problem.status
          })),
          metadata: {
            processing_time: Date.now() - startTime,
            model_used: model,
            database_nodes_created: createdNodes.length,
            database_relationships_created: createdRelationships.length,
            diagnosis_count: aiAnalysis.diagnosis_groups.reduce((count, group) => count + group.diagnoses.length, 0),
            action_count: aiAnalysis.next_actions.length,
            problem_count: aiAnalysis.problem_list.length
          }
        };
        
        // Record this interaction in history
        console.log('📝 Recording interaction in history...');
        const interaction = await recordInteraction(
          sessionId,
          clinical_note,
          frontendResponse,
          frontendResponse.metadata.processing_time,
          frontendResponse.metadata.model_used,
          frontendResponse.metadata.database_nodes_created,
          frontendResponse.metadata.database_relationships_created
        );
        
        // Record diagnosis history for tracking trends
        const diagnosisNodes = frontendResponse.nodes.filter(node => node.type === 'diagnosis');
        if (diagnosisNodes.length > 0) {
          await recordDiagnosisHistory(interaction.id, diagnosisNodes);
          console.log(`📈 Recorded ${diagnosisNodes.length} diagnoses in history`);
        }
        
        console.log('🎉 Medical analysis completed successfully!');
        console.log(`📊 Summary: ${frontendResponse.metadata.diagnosis_count} diagnoses, ${frontendResponse.metadata.action_count} actions, ${frontendResponse.metadata.problem_count} problems`);
        console.log(`🕒 Total processing time: ${frontendResponse.metadata.processing_time}ms`);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(frontendResponse, null, 2)
          }]
        };
        
      } catch (error) {
        console.error('❌ Medical analysis error:', error);
        throw error;
      }
    }
  );
};

export const registerToolsRemote = async (server) => {
  const gcpInfo = await checkGCP();
  if (!gcpInfo || !gcpInfo.project) {
    throw new Error("Cannot register remote tools: GCP project ID could not be determined from the metadata server.");
  }
  const currentProject = gcpInfo.project;
  const currentRegion = gcpInfo.region || 'europe-west1'; // Fallback if region is not available

  // === DATABASE TOOLS (REMOTE) ===
  
  // Tool to test database connection
  server.tool(
    "test_db_connection",
    "Tests the connection to the Cloud SQL database",
    async () => {
      try {
        const isConnected = await testConnection();
        return {
          content: [{
            type: 'text',
            text: isConnected ? 
              '✅ Database connection successful!' : 
              '❌ Database connection failed!'
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Database connection error: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to initialize database tables
  server.tool(
    "initialize_database",
    "Initializes the database tables (nodes and relationships)",
    async () => {
      try {
        await initializeDatabase();
        return {
          content: [{
            type: 'text',
            text: '✅ Database tables initialized successfully!'
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Database initialization error: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to create a new node
  server.tool(
    "create_node",
    "Creates a new node in the medical knowledge graph",
    {
      label: z.string().describe("The text/label for the node (e.g., 'sore throat', 'strep throat')"),
      type: z.string().describe("The type of the node (e.g., 'Symptom', 'Diagnosis', 'Treatment', 'Test')")
    },
    async ({ label, type }) => {
      try {
        const node = await createNode(label, type);
        return {
          content: [{
            type: 'text',
            text: `✅ Created node successfully!\nID: ${node.id}\nLabel: ${node.label}\nType: ${node.type}\nCreated: ${node.created_at}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error creating node: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to delete a node
  server.tool(
    "delete_node",
    "Deletes a node from the database by its ID",
    {
      nodeId: z.number().describe("The ID of the node to delete")
    },
    async ({ nodeId }) => {
      try {
        const deleted = await deleteNode(nodeId);
        return {
          content: [{
            type: 'text',
            text: deleted ? 
              `✅ Node ${nodeId} deleted successfully!` : 
              `❌ Node ${nodeId} not found!`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error deleting node: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to get a specific node
  server.tool(
    "get_node",
    "Retrieves a specific node by its ID",
    {
      nodeId: z.number().describe("The ID of the node to retrieve")
    },
    async ({ nodeId }) => {
      try {
        const node = await getNode(nodeId);
        if (node) {
          return {
            content: [{
              type: 'text',
              text: `📋 Node Details:\nID: ${node.id}\nLabel: ${node.label}\nType: ${node.type}\nCreated: ${node.created_at}\nUpdated: ${node.updated_at}`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `❌ Node ${nodeId} not found!`
            }]
          };
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error retrieving node: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to list nodes
  server.tool(
    "list_nodes",
    "Lists all nodes, optionally filtered by type",
    {
      type: z.string().optional().describe("Optional filter by node type (e.g., 'Symptom', 'Diagnosis')"),
      limit: z.number().optional().default(20).describe("Maximum number of nodes to return (default: 20)")
    },
    async ({ type, limit = 20 }) => {
      try {
        const nodes = await listNodes(type, limit);
        if (nodes.length === 0) {
          return {
            content: [{
              type: 'text',
              text: type ? 
                `📋 No nodes found with type "${type}"` : 
                '📋 No nodes found in database'
            }]
          };
        }

        const nodeList = nodes.map(node => 
          `• ID: ${node.id} | "${node.label}" (${node.type}) | Created: ${node.created_at}`
        ).join('\n');

        const filterText = type ? ` (filtered by type: ${type})` : '';
        return {
          content: [{
            type: 'text',
            text: `📋 Found ${nodes.length} nodes${filterText}:\n\n${nodeList}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error listing nodes: ${error.message}`
          }]
        };
      }
    }
  );

  // Tool to update a node
  server.tool(
    "update_node",
    "Updates a node's label and/or type",
    {
      nodeId: z.number().describe("The ID of the node to update"),
      label: z.string().optional().describe("New label for the node"),
      type: z.string().optional().describe("New type for the node")
    },
    async ({ nodeId, label, type }) => {
      try {
        const node = await updateNode(nodeId, label, type);
        if (node) {
          return {
            content: [{
              type: 'text',
              text: `✅ Node updated successfully!\nID: ${node.id}\nLabel: ${node.label}\nType: ${node.type}\nUpdated: ${node.updated_at}`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `❌ Node ${nodeId} not found!`
            }]
          };
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error updating node: ${error.message}`
          }]
        };
      }
    }
  );

  // === CLOUD RUN TOOLS (REMOTE) ===

  // Listing Cloud Run services (Remote)
  server.tool(
    "list_services",
    `Lists Cloud Run services in GCP project ${currentProject} and a given region.`,
    {
      region: z.string().describe("Region where the services are located").default(currentRegion),
    },
    async ({ region }) => {
      try {
        const services = await listServices(currentProject, region);
        const serviceList = services.map(s => {
          const serviceName = s.name.split('/').pop();
          return `- ${serviceName} (URL: ${s.uri})`;
        }).join('\n');
        return {
          content: [{
            type: 'text',
            text: `Services in project ${currentProject} (location ${region}):\n${serviceList}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error listing services for project ${currentProject} (region ${region}): ${error.message}`
          }]
        };
      }
    }
  );

  // Dynamic resource for getting a specific service (Remote)
  server.tool(
    "get_service",
    `Gets details for a specific Cloud Run service in GCP project ${currentProject}.`,
    {
      region: z.string().describe("Region where the service is located").default(currentRegion),
      service: z.string().describe("Name of the Cloud Run service"),
    },
    async ({ region, service }) => {
      if (typeof service !== 'string') {
        return { content: [{ type: 'text', text: "Error: Service name must be provided." }] };
      }
      try {
        const serviceDetails = await getService(currentProject, region, service);
        if (serviceDetails) {
          return {
            content: [{
              type: 'text',
              text: `Name: ${service}\nRegion: ${region}\nProject: ${currentProject}\nURL: ${serviceDetails.uri}\nLast deployed by: ${serviceDetails.lastModifier}`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `Service ${service} not found in project ${currentProject} (region ${region}).`
            }]
          };
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error getting service ${service} in project ${currentProject} (region ${region}): ${error.message}`
          }]
        };
      }
    }
  );

// Logs for a service
  server.tool(
    "get_service_log",
    "Gets Logs and Error Messages for a specific Cloud Run service.",
    {
      project: z.string().describe("Google Cloud project ID containing the service"),
      region: z.string().describe("Region where the service is located").default('europe-west1'),
      service: z.string().describe("Name of the Cloud Run service"),
    },
    async ({ project, region, service }) => {
      let allLogs = [];
      let requestOptions;
      try {
        do {
          // Fetch a page of logs
          const response = await getServiceLogs(project, region, service, requestOptions);
          
          if (response.logs) {
            allLogs.push(response.logs);
          }
          
          // Set the requestOptions incl pagintion token for the next iteration

          requestOptions = response.requestOptions;

        } while (requestOptions); // Continue as long as there is a next page token
          return {
            content: [{
              type: 'text',
              text: allLogs.join('\n')
            }]
          };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error getting Logs for service ${service} in project ${project} (region ${region}): ${error.message}`
          }]
        };
      }
    }
  );

  // Deploy file contents to Cloud Run (Remote)
  server.tool(
    'deploy_file_contents',
    `Deploy files to Cloud Run by providing their contents directly to the GCP project ${currentProject}.`,
    {
      region: z.string().optional().default(currentRegion).describe('Region to deploy the service to'),
      service: z.string().optional().default('app').describe('Name of the Cloud Run service to deploy to'),
      files: z.array(z.object({
        filename: z.string().describe('Name and path of the file (e.g. "src/index.js" or "data/config.json")'),
        content: z.string().describe('Text content of the file'),
      })).describe('Array of file objects containing filename and content'),
    },
    async ({ region, service, files }) => {
      console.log(`New deploy request (remote): ${JSON.stringify({ project: currentProject, region, service, files })}`);

      if (typeof files !== 'object' || !Array.isArray(files) || files.length === 0) {
        throw new Error('Files must be specified');
      }

      // Validate that each file has content
      for (const file of files) {
        if (!file.content) {
          throw new Error(`File ${file.filename} must have content`);
        }
      }

      // Deploy to Cloud Run
      try {
        const response = await deploy({
          projectId: currentProject,
          serviceName: service,
          region: region,
          files: files,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Cloud Run service ${service} deployed in project ${currentProject}\nCloud Console: https://console.cloud.google.com/run/detail/${region}/${service}?project=${currentProject}\nService URL: ${response.uri}`,
            }
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deploying to Cloud Run: ${error.message || error}`,
            }
          ],
        };
      }
    });
};
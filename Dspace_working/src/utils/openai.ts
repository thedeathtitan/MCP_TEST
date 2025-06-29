import type { DiagnosisNode, DiagnosisEdge, ProblemListItem } from '../types';
import { analyzeWithMCP } from './mcpClient';

// Remove OpenAI API configuration - we now use MCP server
// const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

// Note: We keep the diagnosis schema for reference but it's now handled by MCP client
const DIAGNOSIS_SCHEMA = {
  name: 'generate_comprehensive_diagnosis_workflow',
  description: 'Analyze clinical note and generate diagnosis groups with likelihood-based sizing, next action nodes, and billable problem list',
  parameters: {
    type: 'object',
    properties: {
      diagnosis_groups: {
        type: 'array',
        description: 'Groups of possible diagnoses organized by likelihood and clinical category',
        minItems: 1,
        maxItems: 6,
        items: {
          type: 'object',
          properties: {
            group_id: { type: 'string', description: 'Unique group identifier' },
            group_name: { type: 'string', description: 'Descriptive name for the diagnosis group' },
            diagnoses: {
              type: 'array',
              description: 'Diagnoses within this group',
              minItems: 1,
              maxItems: 6,
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Unique identifier' },
                  label: { type: 'string', description: 'Diagnosis name' },
                  type: { type: 'string', enum: ['diagnosis'], description: 'Node type' },
                  likelihood: { type: 'number', minimum: 0.1, maximum: 1.0, description: 'Likelihood score 0.1-1.0 for node sizing' },
                  confidence: { type: 'number', minimum: 0.1, maximum: 1.0, description: 'Confidence in diagnosis' },
                  evidence: { 
                    type: 'array', 
                    items: { type: 'string' }, 
                    description: 'Supporting clinical findings from the note',
                    minItems: 1
                  },
                  details: { type: 'string', description: 'Clinical reasoning and pathophysiology' },
                  category: { type: 'string', description: 'Medical category (e.g., cardiac, pulmonary, infectious)' }
                },
                required: ['id', 'label', 'type', 'likelihood', 'confidence', 'evidence', 'details', 'category']
              }
            }
          },
          required: ['group_id', 'group_name', 'diagnoses']
        }
      },
      next_actions: {
        type: 'array',
        description: 'Next action nodes that surround diagnoses - tests, treatments, monitoring',
        minItems: 2,
        maxItems: 15,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            label: { type: 'string', description: 'Action description' },
            type: { type: 'string', enum: ['next_action'], description: 'Node type for triangular visualization' },
            priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'], description: 'Action priority' },
            details: { type: 'string', description: 'Why this action is recommended' },
            category: { type: 'string', enum: ['diagnostic', 'therapeutic', 'monitoring', 'consultation'], description: 'Action category' },
            timing: { type: 'string', description: 'When this should be done' },
            related_diagnosis_id: { type: 'string', description: 'ID of the diagnosis this action relates to most closely' }
          },
          required: ['id', 'label', 'type', 'priority', 'details', 'category', 'related_diagnosis_id']
        }
      },
      relationships: {
        type: 'array',
        description: 'Clinical relationships between diagnoses and actions - create comprehensive connections',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique edge identifier' },
            source: { type: 'string', description: 'Source node ID' },
            target: { type: 'string', description: 'Target node ID' },
            relationship: { 
              type: 'string', 
              enum: ['confirms', 'rules-out', 'monitors', 'treats', 'investigates'],
              description: 'Clinical relationship type' 
            },
            label: { type: 'string', description: 'Brief relationship description' },
            strength: { type: 'string', enum: ['strong', 'moderate', 'weak'], description: 'Relationship strength' }
          },
          required: ['id', 'source', 'target', 'relationship', 'label']
        }
      },
      problem_list: {
        type: 'array',
        description: 'Billable problem list with ICD-10 codes for the most likely diagnoses',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique identifier for the problem list item' },
            diagnosis: { type: 'string', description: 'Clinical diagnosis name' },
            icd10Code: { type: 'string', description: 'Corresponding ICD-10 diagnosis code' },
            likelihood: { type: 'number', minimum: 0.1, maximum: 1.0, description: 'Probability of this diagnosis' },
            category: { type: 'string', description: 'Medical category (e.g., cardiac, pulmonary, infectious)' },
            evidence: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: 'Key clinical findings supporting this diagnosis',
              minItems: 1
            },
            status: { 
              type: 'string', 
              enum: ['active', 'resolved', 'ruled-out'], 
              description: 'Current status of this problem',
              default: 'active'
            }
          },
          required: ['id', 'diagnosis', 'icd10Code', 'likelihood', 'category', 'evidence', 'status']
        }
      }
    },
    required: ['diagnosis_groups', 'next_actions', 'relationships', 'problem_list']
  }
};

export interface OpenAIResponse {
  nodes: DiagnosisNode[];
  edges: DiagnosisEdge[];
  problemList?: ProblemListItem[];
}

/**
 * Main analysis function - now uses MCP server with Gemini + PostgreSQL
 * API key is optional since we use our own MCP server
 */
export async function analyzeWithOpenAI(clinicalNote: string, apiKey?: string, retryCount = 0): Promise<OpenAIResponse> {
  if (!clinicalNote.trim()) {
    throw new Error('Clinical note cannot be empty');
  }

  try {
    console.log('🚀 Starting MCP-based medical analysis...');
    console.log('🎯 Using Cloud Run MCP Server + Gemini + PostgreSQL Database');
    
    // Use MCP client for comprehensive medical analysis
    const mcpResponse = await analyzeWithMCP(clinicalNote, apiKey);
    
    // Transform MCP response to the expected format for the frontend
    const nodes: DiagnosisNode[] = mcpResponse.nodes.map((node, index) => ({
      id: node.id,
      position: { x: 100 + (index * 200), y: 100 + (index * 100) },
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
        likelihood: node.likelihood || 0.5,
        confidence: node.confidence || 0.5,
        evidence: node.evidence || [],
        details: node.details || '',
        category: node.category || 'general',
        priority: (node.priority || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
        timing: node.timing || '',
        related_diagnosis_id: node.related_diagnosis_id || ''
      }
    }));

    const edges: DiagnosisEdge[] = mcpResponse.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'related'
    }));

    const problemList: ProblemListItem[] = mcpResponse.problemList.map(problem => ({
      id: problem.id,
      diagnosis: problem.diagnosis,
      icd10Code: problem.icd10Code,
      likelihood: problem.likelihood,
      category: problem.category,
      evidence: problem.evidence,
      status: problem.status as 'active' | 'resolved' | 'ruled-out'
    }));

    console.log('✅ MCP Analysis completed successfully!');
    console.log(`📊 Processing time: ${mcpResponse.metadata?.processing_time}ms`);
    console.log(`🔬 Model used: ${mcpResponse.metadata?.model_used}`);
    console.log(`💾 Database nodes created: ${mcpResponse.metadata?.database_nodes_created}`);

    return { nodes, edges, problemList };
    
  } catch (error) {
    console.error('❌ MCP analysis failed:', error);
    
    // If this is the first attempt, try once more
    if (retryCount < 1) {
      console.log('🔄 Retrying MCP analysis...');
      return analyzeWithOpenAI(clinicalNote, apiKey, retryCount + 1);
    }
    
    // If retries failed, create a minimal fallback response
    console.warn('⚠️ Creating fallback response after MCP failure');
    return createMinimalFallbackResponse(clinicalNote, error);
  }
}

/**
 * Create a minimal fallback response when MCP analysis fails
 */
function createMinimalFallbackResponse(clinicalNote: string, error: any): OpenAIResponse {
  console.warn('Creating minimal fallback response due to error:', error);
  
  // Extract basic medical terms from the clinical note for a simple analysis
  const text = clinicalNote.toLowerCase();
  const symptoms = ['chest pain', 'shortness of breath', 'fever', 'headache', 'nausea', 'abdominal pain']
    .filter(symptom => text.includes(symptom));
  
  const nodes: DiagnosisNode[] = [
    {
      id: 'fallback_assessment',
      position: { x: 200, y: 150 },
      data: {
        id: 'fallback_assessment',
        label: 'Clinical Assessment Required',
        type: 'diagnosis',
        likelihood: 0.8,
        confidence: 0.6,
        evidence: symptoms.length > 0 ? symptoms : ['Clinical presentation requires assessment'],
        details: 'Patient requires comprehensive medical assessment based on clinical presentation',
        category: 'emergency',
        priority: 'high'
      }
    },
    {
      id: 'immediate_workup',
      position: { x: 400, y: 150 },
      data: {
        id: 'immediate_workup',
        label: 'Comprehensive Medical Workup',
        type: 'next_action',
        priority: 'urgent',
        details: 'Immediate comprehensive assessment and diagnostic workup required',
        category: 'diagnostic',
        timing: 'immediately',
        related_diagnosis_id: 'fallback_assessment'
      }
    }
  ];

  const edges: DiagnosisEdge[] = [
    {
      id: 'fallback_edge',
      source: 'fallback_assessment',
      target: 'immediate_workup',
      label: 'requires workup',
      type: 'related'
    }
  ];

  const problemList: ProblemListItem[] = [
    {
      id: 'fallback_problem',
      diagnosis: 'Clinical Assessment Required',
      icd10Code: 'Z00.00',
      likelihood: 0.8,
      category: 'emergency',
      evidence: symptoms.length > 0 ? symptoms : ['Clinical presentation requires assessment'],
      status: 'active'
    }
  ];

  return { nodes, edges, problemList };
}

/**
 * Create grouped layout for diagnosis visualization
 * This function organizes nodes by diagnostic groups for better visualization
 */
export function createGroupedLayout(nodes: DiagnosisNode[], edges: DiagnosisEdge[]): { nodes: DiagnosisNode[], edges: DiagnosisEdge[] } {
  // Group nodes by category
  const diagnosisNodes = nodes.filter(node => node.data.type === 'diagnosis');
  const actionNodes = nodes.filter(node => node.data.type === 'next_action');
  
  // Position diagnosis nodes in a central cluster
  const centerX = 400;
  const centerY = 300;
  const radius = 150;
  
  diagnosisNodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / diagnosisNodes.length;
    node.position = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
  
  // Position action nodes around their related diagnoses
  actionNodes.forEach((actionNode, index) => {
    const relatedDiagnosisId = actionNode.data.related_diagnosis_id;
    const relatedDiagnosis = diagnosisNodes.find(dx => dx.id === relatedDiagnosisId);
    
    if (relatedDiagnosis) {
      // Place actions around their related diagnosis
      const actionRadius = 100;
      const actionAngle = (2 * Math.PI * index) / actionNodes.length;
      actionNode.position = {
        x: relatedDiagnosis.position.x + actionRadius * Math.cos(actionAngle),
        y: relatedDiagnosis.position.y + actionRadius * Math.sin(actionAngle)
      };
    } else {
      // Fallback positioning for unrelated actions
      actionNode.position = {
        x: centerX + 300 + (index * 150),
        y: centerY + 200
      };
    }
  });
  
  return { nodes: [...diagnosisNodes, ...actionNodes], edges };
}

/**
 * Audio transcription using OpenAI Whisper (kept for audio functionality)
 * This still uses OpenAI since Gemini doesn't have audio transcription yet
 */
export async function transcribeWithWhisper(audioBlob: Blob, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenAI API key is required for audio transcription');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');

  try {
    const response = await fetch(WHISPER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const transcription = await response.text();
    return transcription.trim();
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
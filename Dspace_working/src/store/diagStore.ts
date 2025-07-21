import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiagnosisState, ChatMessage, Swimlane, MedicalSwimlane, MedicalSwimlaneCategory } from '../types';
import { analyzeWithOpenAI, transcribeWithWhisper } from '../utils/openai';

const generateAnalysisSummary = (result: { nodes: any[]; edges: any[]; problemList?: any[] }) => {
  const diagnosisNodes = result.nodes.filter(node => node.data.type === 'diagnosis');
  const actionNodes = result.nodes.filter(node => node.data.type === 'next_action');
  
  let summary = "## Analysis Complete\n\n";
  
  if (diagnosisNodes.length > 0) {
    summary += `**Key Diagnoses (${diagnosisNodes.length}):**\n`;
    diagnosisNodes.slice(0, 3).forEach(node => {
      const confidence = node.data.confidence ? ` (${Math.round(node.data.confidence * 100)}%)` : '';
      summary += `• ${node.data.label}${confidence}\n`;
    });
    if (diagnosisNodes.length > 3) {
      summary += `• ...and ${diagnosisNodes.length - 3} more\n`;
    }
    summary += '\n';
  }
  
  if (actionNodes.length > 0) {
    summary += `**Recommended Actions (${actionNodes.length}):**\n`;
    actionNodes.slice(0, 3).forEach(node => {
      summary += `• ${node.data.label}\n`;
    });
    if (actionNodes.length > 3) {
      summary += `• ...and ${actionNodes.length - 3} more\n`;
    }
    summary += '\n';
  }
  
  summary += "View the interactive flowchart below for detailed analysis and relationships.";
  
  return summary;
};

// Load API key from environment variable if available
const getInitialApiKey = (): string => {
  // First try to get from environment variable
  const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (envApiKey && envApiKey !== 'your_openai_api_key_here') {
    return envApiKey;
  }
  return '';
};

// Default medical swimlanes configuration for clinical workflows
const getDefaultMedicalSwimlanes = (): MedicalSwimlane[] => {
  return [
    {
      id: 'critical',
      category: 'CRITICAL',
      title: '🔴 Critical',
      icon: '🚨',
      color: '#d32f2f',
      priority: 1,
      autoExpand: true,
      expandRules: [
        { condition: 'priority', operator: 'equals', value: 'CRITICAL' },
        { condition: 'urgency', operator: 'equals', value: 'IMMEDIATE' }
      ],
      isCollapsed: false,
      visible: true,
      description: 'Life-threatening conditions requiring immediate attention'
    },
    {
      id: 'cardiovascular',
      category: 'CARDIOVASCULAR',
      title: '🫀 Cardiovascular',
      icon: '❤️',
      color: '#1976d2',
      priority: 2,
      autoExpand: false,
      expandRules: [
        { condition: 'confidence', operator: 'greater_than', value: 0.7 },
        { condition: 'attention_required', operator: 'equals', value: true }
      ],
      isCollapsed: true,
      visible: true,
      description: 'Heart and circulation related conditions'
    },
    {
      id: 'respiratory',
      category: 'RESPIRATORY',
      title: '🫁 Respiratory',
      icon: '💨',
      color: '#0288d1',
      priority: 3,
      autoExpand: false,
      expandRules: [
        { condition: 'confidence', operator: 'greater_than', value: 0.7 },
        { condition: 'attention_required', operator: 'equals', value: true }
      ],
      isCollapsed: true,
      visible: true,
      description: 'Lung and breathing related conditions'
    },
    {
      id: 'neurological',
      category: 'NEUROLOGICAL',
      title: '🧠 Neurological',
      icon: '🧠',
      color: '#7b1fa2',
      priority: 4,
      autoExpand: false,
      expandRules: [
        { condition: 'confidence', operator: 'greater_than', value: 0.7 },
        { condition: 'attention_required', operator: 'equals', value: true }
      ],
      isCollapsed: true,
      visible: true,
      description: 'Brain and nervous system conditions'
    },
    {
      id: 'infectious',
      category: 'INFECTIOUS',
      title: '🦠 Infectious',
      icon: '🦠',
      color: '#f57c00',
      priority: 5,
      autoExpand: false,
      expandRules: [
        { condition: 'confidence', operator: 'greater_than', value: 0.7 },
        { condition: 'attention_required', operator: 'equals', value: true }
      ],
      isCollapsed: true,
      visible: true,
      description: 'Infectious diseases and antimicrobial therapy'
    },
    {
      id: 'diagnostic',
      category: 'DIAGNOSTIC',
      title: '🩺 Diagnostic',
      icon: '🔬',
      color: '#00796b',
      priority: 6,
      autoExpand: false,
      expandRules: [
        { condition: 'time_sensitive', operator: 'equals', value: true }
      ],
      isCollapsed: true,
      visible: true,
      description: 'Laboratory tests, imaging, and diagnostic procedures'
    },
    {
      id: 'routine',
      category: 'ROUTINE',
      title: '📋 Routine',
      icon: '✅',
      color: '#388e3c',
      priority: 7,
      autoExpand: false,
      expandRules: [],
      isCollapsed: true,
      visible: true,
      description: 'Routine care and follow-up items'
    }
  ];
};

// Legacy support - keep old function for backward compatibility
const getDefaultSwimlanes = (): Swimlane[] => {
  return [
    {
      id: 'diagnostic',
      title: 'Diagnostic',
      category: 'diagnostic',
      orientation: 'horizontal',
      color: '#1976d2',
      order: 1,
      visible: true
    },
    {
      id: 'immediate-actions',
      title: 'Immediate Actions',
      category: 'immediate-actions',
      orientation: 'horizontal',
      color: '#d32f2f',
      order: 2,
      visible: true
    },
    {
      id: 'follow-up',
      title: 'Follow-up',
      category: 'follow-up',
      orientation: 'horizontal',
      color: '#388e3c',
      order: 3,
      visible: true
    }
  ];
};

// Enhanced auto-assignment of nodes to medical swimlanes with comprehensive keyword matching
const autoAssignNodesToMedicalSwimlanes = (nodes: any[]) => {
  console.log('🔄 Auto-assigning nodes to medical swimlanes...', nodes.length, 'nodes');
  
  return nodes.map(node => {
    if (node.data.swimlane) {
      // Node already has a swimlane assignment
      console.log(`✅ Node ${node.id} already assigned to ${node.data.swimlane}`);
      return node;
    }

    // Normalize priority from AI response
    const normalizedPriority = normalizePriority(node.data.priority);
    const normalizedUrgency = normalizeUrgency(node.data.urgency);
    
    // Determine swimlane based on medical intelligence
    let swimlane: MedicalSwimlaneCategory = 'DIAGNOSTIC'; // Changed default to DIAGNOSTIC

    // Critical priority always goes to CRITICAL
    if (normalizedPriority === 'CRITICAL' || normalizedUrgency === 'IMMEDIATE') {
      swimlane = 'CRITICAL';
    }
    // System-based assignment using enhanced medical keywords
    else if (node.data.category || node.data.label || node.data.details) {
      const content = `${node.data.category || ''} ${node.data.label || ''} ${node.data.details || ''}`.toLowerCase();
      
      // Enhanced Cardiovascular keywords
      if (content.includes('heart') || content.includes('cardiac') || content.includes('chest pain') || 
          content.includes('arrhythmia') || content.includes('hypertension') || content.includes('mi') ||
          content.includes('angina') || content.includes('ecg') || content.includes('ekg') ||
          content.includes('cardiovascular') || content.includes('coronary') || content.includes('myocardial') ||
          content.includes('aortic') || content.includes('vascular') || content.includes('pericarditis') ||
          content.includes('endocarditis') || content.includes('valve') || content.includes('atrial') ||
          content.includes('ventricular') || content.includes('systolic') || content.includes('diastolic')) {
        swimlane = 'CARDIOVASCULAR';
      }
      // Enhanced Respiratory keywords
      else if (content.includes('lung') || content.includes('respiratory') || content.includes('breath') ||
               content.includes('copd') || content.includes('asthma') || content.includes('pneumonia') ||
               content.includes('dyspnea') || content.includes('cough') || content.includes('chest x') ||
               content.includes('oxygen') || content.includes('pulmonary') || content.includes('hypoxia') ||
               content.includes('ventilation') || content.includes('pe') || content.includes('pneumothorax') ||
               content.includes('pleural') || content.includes('bronch') || content.includes('respiratory failure')) {
        swimlane = 'RESPIRATORY';
      }
      // Enhanced Neurological keywords
      else if (content.includes('brain') || content.includes('neuro') || content.includes('seizure') ||
               content.includes('stroke') || content.includes('headache') || content.includes('confusion') ||
               content.includes('altered') || content.includes('ct head') || content.includes('mri') ||
               content.includes('consciousness') || content.includes('mental status') || content.includes('cva') ||
               content.includes('migraine') || content.includes('encephalitis') || content.includes('meningitis') ||
               content.includes('dementia') || content.includes('delirium') || content.includes('syncope')) {
        swimlane = 'NEUROLOGICAL';
      }
      // Enhanced Infectious keywords
      else if (content.includes('infection') || content.includes('sepsis') || content.includes('fever') ||
               content.includes('antibiotic') || content.includes('culture') || content.includes('wbc') ||
               content.includes('inflammatory') || content.includes('immune') || content.includes('bacteria') ||
               content.includes('viral') || content.includes('infectious') || content.includes('cellulitis') ||
               content.includes('abscess') || content.includes('uti') || content.includes('pneumonia') ||
               content.includes('covid') || content.includes('influenza') || content.includes('bacteremia')) {
        swimlane = 'INFECTIOUS';
      }
      // Enhanced Diagnostic keywords
      else if (content.includes('lab') || content.includes('test') || content.includes('imaging') ||
               content.includes('blood') || content.includes('urine') || content.includes('xray') ||
               content.includes('ultrasound') || content.includes('biopsy') || content.includes('culture') ||
               content.includes('ct scan') || content.includes('mri') || content.includes('ekg') ||
               content.includes('echocardiogram') || content.includes('workup') || content.includes('panel') ||
               content.includes('assessment') || content.includes('evaluation') || content.includes('screening')) {
        swimlane = 'DIAGNOSTIC';
      }
    }

    // Enhanced priority-based logic for actions
    if (node.data.type === 'next_action') {
      const actionContent = `${node.data.category || ''} ${node.data.label || ''} ${node.data.details || ''}`.toLowerCase();
      
      if (normalizedPriority === 'HIGH' || normalizedUrgency === 'HOURS') {
        // Keep system-based assignment for high priority
        // High priority actions stay in their assigned lanes
      } else if (normalizedPriority === 'LOW' && swimlane === 'DIAGNOSTIC' && 
                 !actionContent.includes('lab') && !actionContent.includes('test') && 
                 !actionContent.includes('imaging') && !actionContent.includes('blood')) {
        // Only low priority actions with no specific diagnostic keywords go to ROUTINE
        swimlane = 'ROUTINE';
      }
    }

    console.log(`🎯 Assigned node ${node.id} (${node.data.label}) to ${swimlane} swimlane`);

    return {
      ...node,
      data: {
        ...node.data,
        swimlane: swimlane as MedicalSwimlaneCategory,
        priority: normalizedPriority,
        urgency: normalizedUrgency
      }
    };
  });
};

// Helper function to normalize priority values from AI responses
const normalizePriority = (priority: any): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (!priority) return 'MEDIUM';
  
  const p = String(priority).toLowerCase();
  if (p.includes('critical') || p.includes('urgent') || p.includes('immediate')) return 'CRITICAL';
  if (p.includes('high')) return 'HIGH';
  if (p.includes('low')) return 'LOW';
  return 'MEDIUM';
};

// Helper function to normalize urgency values from AI responses
const normalizeUrgency = (urgency: any): 'IMMEDIATE' | 'HOURS' | 'DAYS' | 'FOLLOW_UP' => {
  if (!urgency) return 'DAYS';
  
  const u = String(urgency).toLowerCase();
  if (u.includes('immediate') || u.includes('now') || u.includes('stat')) return 'IMMEDIATE';
  if (u.includes('hour')) return 'HOURS';
  if (u.includes('follow') || u.includes('outpatient')) return 'FOLLOW_UP';
  return 'DAYS';
};

// Auto-expansion logic for swimlanes with content (DISABLED - keep all collapsed for new design)
const autoExpandSwimlanes = (swimlanes: MedicalSwimlane[], nodes: any[]): MedicalSwimlane[] => {
  console.log('🔄 Keeping swimlanes collapsed for two-section design...');
  
  // Count nodes per swimlane for display purposes
  const nodeCounts = new Map<MedicalSwimlaneCategory, number>();
  nodes.forEach(node => {
    const category = node.data.swimlane;
    if (category) {
      nodeCounts.set(category, (nodeCounts.get(category) || 0) + 1);
    }
  });
  
  // Keep all swimlanes collapsed by default - user can expand manually
  return swimlanes.map(lane => {
    const nodeCount = nodeCounts.get(lane.category) || 0;
    console.log(`📊 ${lane.category} swimlane: ${nodeCount} nodes (staying collapsed)`);
    
    return { ...lane, isCollapsed: true }; // Always start collapsed
  });
};

// Legacy auto-assignment function for backward compatibility
const autoAssignNodesToSwimlanes = (nodes: any[]) => {
  return nodes.map(node => {
    if (node.data.swimlane) {
      return node;
    }

    let swimlane = 'diagnostic';
    
    if (node.data.type === 'diagnosis') {
      swimlane = 'diagnostic';
    } else if (node.data.type === 'next_action') {
      if (node.data.priority === 'urgent' || node.data.priority === 'high') {
        swimlane = 'immediate-actions';
      } else {
        swimlane = 'follow-up';
      }
    }

    return {
      ...node,
      data: {
        ...node.data,
        swimlane: swimlane as MedicalSwimlaneCategory
      }
    };
  });
};

export const useDiagStore = create<DiagnosisState>()(
  persist(
    (set, get) => ({
      note: '',
      graph: { nodes: [], edges: [] },
      problemList: [],
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      apiKey: getInitialApiKey(), // Load from environment or empty string
      isRecording: false,
      isTranscribing: false,
      isFullScreen: false,
      viewMode: 'linear',
      medicalSwimlanes: getDefaultMedicalSwimlanes(),
      // Legacy support
      swimlanes: getDefaultSwimlanes(),
      swimlaneEnabled: true, // Now enabled by default
      
      setNote: (note: string) => set({ note }),
      
      setGraph: (graph) => {
        console.log('🔄 Setting graph with', graph.nodes.length, 'nodes and', graph.edges.length, 'edges');
        
        // Auto-assign nodes to medical swimlanes if they don't have assignments
        const nodesWithMedicalSwimlanes = autoAssignNodesToMedicalSwimlanes(graph.nodes);
        
        // Auto-expand swimlanes that have content
        const currentSwimlanes = get().medicalSwimlanes;
        const expandedSwimlanes = autoExpandSwimlanes(currentSwimlanes, nodesWithMedicalSwimlanes);
        
        set({ 
          graph: {
            ...graph,
            nodes: nodesWithMedicalSwimlanes
          },
          medicalSwimlanes: expandedSwimlanes
        });
        
        console.log('✅ Graph updated with auto-assigned swimlanes and auto-expanded lanes');
      },
      
      setProblemList: (problemList) => set({ problemList }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setStreaming: (streaming: boolean) => set({ isStreaming: streaming }),
      
      setError: (error: string | null) => set({ error }),
      
      setApiKey: (apiKey: string) => set({ apiKey }),
      
      setRecording: (recording: boolean) => set({ isRecording: recording }),
      
      setTranscribing: (transcribing: boolean) => set({ isTranscribing: transcribing }),
      
      setFullScreen: (fullScreen: boolean) => set({ isFullScreen: fullScreen }),
      
      setViewMode: (viewMode: 'linear' | '3d') => set({ viewMode }),
      
      // New medical swimlane methods
      setMedicalSwimlanes: (medicalSwimlanes: MedicalSwimlane[]) => set({ medicalSwimlanes }),
      
      toggleSwimlaneCollapse: (swimlaneId: string) => {
        set((state) => ({
          medicalSwimlanes: state.medicalSwimlanes.map(swimlane => 
            swimlane.id === swimlaneId 
              ? { ...swimlane, isCollapsed: !swimlane.isCollapsed }
              : swimlane
          )
        }));
      },
      
      updateMedicalSwimlane: (id: string, updates: Partial<MedicalSwimlane>) => {
        set((state) => ({
          medicalSwimlanes: state.medicalSwimlanes.map(swimlane => 
            swimlane.id === id ? { ...swimlane, ...updates } : swimlane
          )
        }));
      },
      
      assignNodeToMedicalSwimlane: (nodeId: string, swimlaneCategory: MedicalSwimlaneCategory) => {
        set((state) => ({
          graph: {
            ...state.graph,
            nodes: state.graph.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, data: { ...node.data, swimlane: swimlaneCategory } }
                : node
            )
          }
        }));
      },
      
      // Legacy support
      setSwimlanes: (swimlanes: Swimlane[]) => set({ swimlanes }),
      
      setSwimlaneEnabled: (enabled: boolean) => set({ swimlaneEnabled: enabled }),
      
      addSwimlane: (swimlane: Swimlane) => {
        set((state) => ({
          swimlanes: [...state.swimlanes, swimlane]
        }));
      },
      
      updateSwimlane: (id: string, updates: Partial<Swimlane>) => {
        set((state) => ({
          swimlanes: state.swimlanes.map(swimlane => 
            swimlane.id === id ? { ...swimlane, ...updates } : swimlane
          )
        }));
      },
      
      removeSwimlane: (id: string) => {
        set((state) => ({
          swimlanes: state.swimlanes.filter(swimlane => swimlane.id !== id)
        }));
      },
      
      assignNodeToSwimlane: (nodeId: string, swimlaneId: string) => {
        set((state) => ({
          graph: {
            ...state.graph,
            nodes: state.graph.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, data: { ...node.data, swimlane: swimlaneId as MedicalSwimlaneCategory } }
                : node
            )
          }
        }));
      },
      
      addMessage: (message: ChatMessage) => {
        set((state) => ({
          messages: [...state.messages, message]
        }));
      },
      
      updateMessage: (id: string, updates: Partial<ChatMessage>) => {
        set((state) => ({
          messages: state.messages.map(msg => 
            msg.id === id ? { ...msg, ...updates } : msg
          )
        }));
      },
      
      clearChat: () => {
        set({
          messages: [],
          graph: { nodes: [], edges: [] },
          problemList: [],
          isFullScreen: false,
          error: null
        });
      },
      
      analyzeNote: async (note: string) => {
        const { setLoading, setError, setGraph, setProblemList, setFullScreen, setStreaming, addMessage, updateMessage, apiKey } = get();
        
        if (!note.trim()) {
          setError('Please enter a clinical note to analyze');
          return;
        }
        
        // API key is now optional for medical analysis since we use MCP server
        // Only show a warning if no API key is provided
        if (!apiKey.trim()) {
          console.log('🔄 Using MCP server for analysis (no OpenAI API key provided)');
        }
        
        // Add user message to chat
        const userMessageId = Date.now().toString();
        addMessage({
          id: userMessageId,
          role: 'user',
          content: note,
          createdAt: new Date()
        });

        // Add AI streaming message
        const aiMessageId = (Date.now() + 1).toString();
        addMessage({
          id: aiMessageId,
          role: 'ai',
          content: '',
          createdAt: new Date(),
          isStreaming: true
        });

        try {
          setLoading(true);
          setStreaming(true);
          setError(null);
          
          console.log('🚀 Starting MCP-based medical analysis...');
          
          // Use MCP server for analysis (API key is optional)
          const result = await analyzeWithOpenAI(note, apiKey || undefined);
          setGraph(result);
          
          // Set problem list if available
          if (result.problemList) {
            setProblemList(result.problemList);
          }

          // Generate AI summary from analysis results
          const aiSummary = generateAnalysisSummary(result);
          
          // Update AI message with analysis summary
          updateMessage(aiMessageId, {
            content: aiSummary,
            isStreaming: false,
            metadata: {
              analysisId: aiMessageId,
              hasAnalysis: true
            }
          });
          
          console.log('✅ Analysis completed successfully!');
          // Note: Navigation to analysis page is handled by App.tsx based on graph state
          
        } catch (error) {
          console.error('❌ Analysis error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to analyze note';
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },
      
      transcribeAudio: async (audioBlob: Blob) => {
        const { setTranscribing, setError, apiKey } = get();
        
        // API key is still required for audio transcription (Whisper)
        if (!apiKey.trim()) {
          setError('OpenAI API key required for audio transcription. Medical analysis works without an API key.');
          throw new Error('API key required for audio transcription');
        }
        
        try {
          setTranscribing(true);
          setError(null);
          
          console.log('🎤 Transcribing audio with OpenAI Whisper...');
          const transcription = await transcribeWithWhisper(audioBlob, apiKey);
          console.log('✅ Audio transcription completed');
          return transcription;
          
        } catch (error) {
          console.error('❌ Transcription error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
          setError(errorMessage);
          throw error;
        } finally {
          setTranscribing(false);
        }
      }
    }),
    {
      name: 'diagnosis-storage',
      // Only persist the API key and swimlane preferences, not the sensitive clinical data
      partialize: (state) => ({ 
        apiKey: state.apiKey,
        medicalSwimlanes: state.medicalSwimlanes,
        swimlanes: state.swimlanes, // Legacy support
        swimlaneEnabled: state.swimlaneEnabled
      }),
    }
  )
);
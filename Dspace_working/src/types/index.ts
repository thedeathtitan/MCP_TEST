export type NodePosition = {
  x: number;
  y: number;
};

export type NodeType = 'diagnosis' | 'next_action' | 'completed';

export interface DiagnosisNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  details?: string;
  confidence?: number;
  likelihood?: number;
  evidence?: string[];
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  urgency?: 'IMMEDIATE' | 'HOURS' | 'DAYS' | 'FOLLOW_UP';
  category?: string;
  timing?: string;
  group_name?: string;
  related_diagnosis_id?: string;
  swimlane?: MedicalSwimlaneCategory;
  attention_required?: boolean;
  time_sensitive?: boolean;
  system_involvement?: string[];
}

export interface DiagnosisNode {
  id: string;
  position: NodePosition;
  data: DiagnosisNodeData;
}

export interface DiagnosisEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'next-step' | 'supports' | 'excludes' | 'related';
}

export interface ProblemListItem {
  id: string;
  diagnosis: string;
  icd10Code: string;
  likelihood: number;
  category: string;
  evidence: string[];
  status: 'active' | 'resolved' | 'ruled-out';
}

export type MedicalSwimlaneCategory = 
  | 'CRITICAL'
  | 'CARDIOVASCULAR' 
  | 'RESPIRATORY'
  | 'NEUROLOGICAL'
  | 'INFECTIOUS'
  | 'DIAGNOSTIC'
  | 'ROUTINE';

export interface ExpansionRule {
  condition: 'priority' | 'urgency' | 'confidence' | 'attention_required' | 'time_sensitive';
  operator: 'equals' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface MedicalSwimlane {
  id: string;
  category: MedicalSwimlaneCategory;
  title: string;
  icon: string;
  color: string;
  priority: number;
  autoExpand: boolean;
  expandRules: ExpansionRule[];
  isCollapsed: boolean;
  visible: boolean;
  description?: string;
}

// Keep old interface for backward compatibility, but deprecated
export interface Swimlane {
  id: string;
  title: string;
  category: 'diagnostic' | 'immediate-actions' | 'follow-up' | 'custom';
  orientation?: 'horizontal' | 'vertical';
  color?: string;
  order: number;
  visible: boolean;
}

export interface AnalysisResponse {
  nodes: DiagnosisNode[];
  edges: DiagnosisEdge[];
  problemList?: ProblemListItem[];
  metadata?: {
    processing_time?: number;
    confidence?: number;
    model_used?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
  metadata?: {
    analysisId?: string;
    hasAnalysis?: boolean;
  };
}

export interface DiagnosisState {
  note: string;
  graph: {
    nodes: DiagnosisNode[];
    edges: DiagnosisEdge[];
  };
  problemList: ProblemListItem[];
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  apiKey: string;
  isRecording: boolean;
  isTranscribing: boolean;
  isFullScreen: boolean;
  viewMode: 'linear' | '3d';
  medicalSwimlanes: MedicalSwimlane[];
  // Legacy support
  swimlanes: Swimlane[];
  swimlaneEnabled: boolean;
  setNote: (note: string) => void;
  setGraph: (graph: { nodes: DiagnosisNode[]; edges: DiagnosisEdge[] }) => void;
  setProblemList: (problemList: ProblemListItem[]) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  setApiKey: (apiKey: string) => void;
  setRecording: (recording: boolean) => void;
  setTranscribing: (transcribing: boolean) => void;
  setFullScreen: (fullScreen: boolean) => void;
  setViewMode: (viewMode: 'linear' | '3d') => void;
  // New medical swimlane methods
  setMedicalSwimlanes: (swimlanes: MedicalSwimlane[]) => void;
  toggleSwimlaneCollapse: (swimlaneId: string) => void;
  updateMedicalSwimlane: (id: string, updates: Partial<MedicalSwimlane>) => void;
  assignNodeToMedicalSwimlane: (nodeId: string, swimlaneCategory: MedicalSwimlaneCategory) => void;
  // Legacy support
  setSwimlanes: (swimlanes: Swimlane[]) => void;
  setSwimlaneEnabled: (enabled: boolean) => void;
  addSwimlane: (swimlane: Swimlane) => void;
  updateSwimlane: (id: string, updates: Partial<Swimlane>) => void;
  removeSwimlane: (id: string) => void;
  assignNodeToSwimlane: (nodeId: string, swimlaneId: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearChat: () => void;
  analyzeNote: (note: string) => Promise<void>;
  transcribeAudio: (audioBlob: Blob) => Promise<string>;
}
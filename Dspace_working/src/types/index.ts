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
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  category?: string;
  timing?: string;
  group_name?: string;
  related_diagnosis_id?: string;
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
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearChat: () => void;
  analyzeNote: (note: string) => Promise<void>;
  transcribeAudio: (audioBlob: Blob) => Promise<string>;
}
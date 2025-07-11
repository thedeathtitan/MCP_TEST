import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiagnosisState, ChatMessage } from '../types';
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
      
      setNote: (note: string) => set({ note }),
      
      setGraph: (graph) => set({ graph }),
      
      setProblemList: (problemList) => set({ problemList }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setStreaming: (streaming: boolean) => set({ isStreaming: streaming }),
      
      setError: (error: string | null) => set({ error }),
      
      setApiKey: (apiKey: string) => set({ apiKey }),
      
      setRecording: (recording: boolean) => set({ isRecording: recording }),
      
      setTranscribing: (transcribing: boolean) => set({ isTranscribing: transcribing }),
      
      setFullScreen: (fullScreen: boolean) => set({ isFullScreen: fullScreen }),
      
      setViewMode: (viewMode: 'linear' | '3d') => set({ viewMode }),
      
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
      // Only persist the API key, not the sensitive clinical data
      partialize: (state) => ({ apiKey: state.apiKey }),
    }
  )
);
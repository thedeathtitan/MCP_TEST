import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiagnosisState } from '../types';
import { analyzeWithOpenAI, transcribeWithWhisper } from '../utils/openai';

export const useDiagStore = create<DiagnosisState>()(
  persist(
    (set, get) => ({
      note: '',
      graph: { nodes: [], edges: [] },
      problemList: [],
      isLoading: false,
      error: null,
      apiKey: '',
      isRecording: false,
      isTranscribing: false,
      
      setNote: (note: string) => set({ note }),
      
      setGraph: (graph) => set({ graph }),
      
      setProblemList: (problemList) => set({ problemList }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setError: (error: string | null) => set({ error }),
      
      setApiKey: (apiKey: string) => set({ apiKey }),
      
      setRecording: (recording: boolean) => set({ isRecording: recording }),
      
      setTranscribing: (transcribing: boolean) => set({ isTranscribing: transcribing }),
      
      analyzeNote: async (note: string) => {
        const { setLoading, setError, setGraph, setProblemList, apiKey } = get();
        
        if (!note.trim()) {
          setError('Please enter a clinical note to analyze');
          return;
        }
        
        // API key is now optional for medical analysis since we use MCP server
        // Only show a warning if no API key is provided
        if (!apiKey.trim()) {
          console.log('🔄 Using MCP server for analysis (no OpenAI API key provided)');
        }
        
        try {
          setLoading(true);
          setError(null);
          
          console.log('🚀 Starting MCP-based medical analysis...');
          
          // Use MCP server for analysis (API key is optional)
          const result = await analyzeWithOpenAI(note, apiKey || undefined);
          setGraph(result);
          
          // Set problem list if available
          if (result.problemList) {
            setProblemList(result.problemList);
          }
          
          console.log('✅ Analysis completed successfully!');
          
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
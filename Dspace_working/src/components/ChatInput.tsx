import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Alert } from '@mui/material';
import { Send, Mic, Stop } from '@mui/icons-material';
import { useDiagStore } from '../store/diagStore';

export function ChatInput() {
  const { analyzeNote, isLoading, error, transcribeAudio, apiKey } = useDiagStore();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await analyzeNote(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        await handleTranscription();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async () => {
    if (!apiKey.trim()) return;
    
    setIsTranscribing(true);

    try {
      if (audioChunksRef.current.length === 0) {
        throw new Error('No audio data recorded');
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const transcription = await transcribeAudio(audioBlob);
      
      const newInput = input ? `${input}\n\n${transcription}` : transcription;
      setInput(newInput);
      
    } catch (err) {
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isTranscribing && apiKey.trim()) {
      startRecording();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Recording/Transcribing Status */}
      {(isRecording || isTranscribing) && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: -40, 
            left: 16, 
            bgcolor: 'background.paper', 
            px: 2, 
            py: 1, 
            borderRadius: 2, 
            boxShadow: 1,
            border: 1,
            borderColor: 'divider',
            fontSize: '0.875rem',
            color: 'text.secondary',
            zIndex: 10,
          }}
        >
          {isRecording ? '🔴 Recording...' : '🎤 Transcribing...'}
        </Box>
      )}
      
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 4,
          bgcolor: 'background.paper',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          maxWidth: '768px',
          mx: 'auto',
        }}
      >
        {/* Voice Button */}
        {apiKey.trim() && (
          <IconButton
            onClick={handleVoiceClick}
            disabled={isTranscribing}
            size="small"
            sx={{
              p: 1,
              color: isRecording ? 'error.main' : 'text.secondary',
              '&:hover': {
                bgcolor: isRecording ? 'error.light' : 'action.hover',
              },
              '&:disabled': {
                color: 'action.disabled',
              }
            }}
            title={isRecording ? 'Stop recording' : 'Start voice recording'}
          >
            {isRecording ? <Stop fontSize="small" /> : <Mic fontSize="small" />}
          </IconButton>
        )}

        {/* Text Input */}
        <TextField
          inputRef={textareaRef}
          multiline
          minRows={1}
          maxRows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Medical AI Assistant..."
          disabled={isLoading}
          fullWidth
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '1rem',
              lineHeight: 1.5,
              '& textarea': {
                resize: 'none',
                '&::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.7,
                },
              },
            },
          }}
        />

        {/* Send Button */}
        <IconButton
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          size="small"
          sx={{
            p: 1,
            bgcolor: input.trim() && !isLoading ? 'text.primary' : 'action.disabledBackground',
            color: input.trim() && !isLoading ? 'background.paper' : 'action.disabled',
            '&:hover': {
              bgcolor: input.trim() && !isLoading ? 'text.secondary' : 'action.disabledBackground',
            },
            '&:disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            },
            transition: 'all 0.2s ease-in-out',
          }}
          title="Send message (Enter)"
        >
          <Send fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
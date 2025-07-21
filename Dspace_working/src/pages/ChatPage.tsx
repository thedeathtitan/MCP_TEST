import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { ChatContainer } from '../components/ChatContainer';
import { ChatInput } from '../components/ChatInput';
import { ApiKeyInput } from '../components/ApiKeyInput';
import { useDiagStore } from '../store/diagStore';

const ChatPage: React.FC = () => {
  const { messages, apiKey, analyzeNote } = useDiagStore();
  const hasMessages = messages.length > 0;

  const handleExampleClick = async (example: string) => {
    await analyzeNote(example);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Header - Minimal branding */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          py: 2,
          position: 'sticky',
          top: 0,
          bgcolor: 'background.default',
          zIndex: 10,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '1.125rem',
              }}
            >
              Medical Diagnostic Assistant
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
              }}
            >
              AI-powered clinical reasoning with OpenAI O3
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Chat Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!hasMessages ? (
          /* Welcome Screen */
          <Box 
            sx={{ 
              flex: 1, 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: 2,
              py: 4,
            }}
          >
            <Container maxWidth="md">
              <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 2,
                  }}
                >
                  How can I help with your clinical case today?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    maxWidth: '600px',
                    mx: 'auto',
                    lineHeight: 1.6,
                  }}
                >
                  Describe your patient's clinical presentation, and I'll provide comprehensive diagnostic analysis
                  with differential diagnoses, recommended actions, and ICD-10 problem lists.
                </Typography>
              </Box>

              {/* API Key Input */}
              <Box sx={{ mb: 4 }}>
                <ApiKeyInput 
                  onApiKeySet={(key: string) => {
                    const { setApiKey } = useDiagStore.getState();
                    setApiKey(key);
                  }}
                  hasApiKey={!!apiKey}
                />
              </Box>

              {/* Sample Cases */}
              <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'text.primary',
                    mb: 2,
                    textAlign: 'center',
                  }}
                >
                  Try these examples:
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                    gap: 2,
                  }}
                >
                  {[
                    'Chest pain and shortness of breath in a 65-year-old male',
                    'Fever and altered mental status in elderly patient',
                    'Abdominal pain with nausea in a 45-year-old female',
                    'Headache and visual changes in hypertensive patient',
                  ].map((example, index) => (
                    <Box
                      key={index}
                      onClick={() => handleExampleClick(example)}
                      sx={{
                        p: 3,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.primary',
                          fontSize: '0.875rem',
                        }}
                      >
                        {example}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Container>
          </Box>
        ) : (
          /* Chat Messages */
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <ChatContainer />
          </Box>
        )}

        {/* Input Area - Fixed at bottom */}
        <Box
          sx={{
            flexShrink: 0,
            borderTop: hasMessages ? 1 : 0,
            borderColor: 'divider',
            bgcolor: 'background.default',
            p: 2,
          }}
        >
          <ChatInput />
        </Box>
      </Box>

      {/* Footer Disclaimer */}
      <Box
        sx={{
          flexShrink: 0,
          py: 1,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            ⚠️ For Research & Education Only • Not for Clinical Diagnosis
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default ChatPage;
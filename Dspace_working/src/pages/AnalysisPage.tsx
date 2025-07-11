import React from 'react';
import { Box, Typography, Container, IconButton, Chip, Button } from '@mui/material';
import { ArrowBack, ViewInAr, Timeline, ZoomInMap } from '@mui/icons-material';
import { ChatContainer } from '../components/ChatContainer';
import { ChatInput } from '../components/ChatInput';
import { Graph3D } from '../components/Graph3D';
import LinearFlow from '../components/LinearFlow';
import FullScreenToolbar from '../components/FullScreenToolbar';
// Import individual problem list item for embedded display
import type { ProblemListItem } from '../types';
import { useDiagStore } from '../store/diagStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    viewMode, 
    isFullScreen, 
    setViewMode, 
    setFullScreen,
    clearChat,
    graph,
    problemList 
  } = useDiagStore();

  const handleNewChat = () => {
    clearChat();
    navigate('/chat');
  };

  // Full screen mode
  if (isFullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1000,
          backgroundColor: 'background.default'
        }}
      >
        <Box sx={{ width: '100%', height: '100%' }}>
          {viewMode === 'linear' ? <LinearFlow isFullScreen={true} /> : <Graph3D />}
        </Box>
        
        <FullScreenToolbar
          isVisible={true}
          viewMode={viewMode}
          onClose={() => setFullScreen(false)}
          onToggleView={() => setViewMode(viewMode === 'linear' ? '3d' : 'linear')}
          onZoomIn={() => console.log('Zoom in')}
          onZoomOut={() => console.log('Zoom out')}
          onResetView={() => console.log('Reset view')}
          onDownload={() => console.log('Download')}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            py: 2,
            bgcolor: 'background.default',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Left side - Back button and title */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                  onClick={handleNewChat}
                  sx={{
                    p: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      fontSize: '1.125rem',
                    }}
                  >
                    Analysis Results
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                    }}
                  >
                    {graph.nodes.filter(n => n.data?.type === 'diagnosis').length} diagnoses • {graph.nodes.filter(n => n.data?.type === 'next_action').length} actions
                  </Typography>
                </Box>
              </Box>

              {/* Right side - View controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant={viewMode === 'linear' ? 'contained' : 'outlined'}
                  size="small"
                  startIcon={<Timeline />}
                  onClick={() => setViewMode('linear')}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  Linear
                </Button>
                <Button
                  variant={viewMode === '3d' ? 'contained' : 'outlined'}
                  size="small"
                  startIcon={<ViewInAr />}
                  onClick={() => setViewMode('3d')}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  3D
                </Button>
                <IconButton
                  onClick={() => setFullScreen(true)}
                  sx={{
                    ml: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  title="Enter full-screen mode"
                >
                  <ZoomInMap />
                </IconButton>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Panel - Chat */}
          <Box
            sx={{
              width: '400px',
              borderRight: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
              overflow: 'hidden',
            }}
          >
            {/* Chat Messages */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <ChatContainer />
            </Box>

            {/* Chat Input - Fixed at bottom */}
            <Box
              sx={{
                flexShrink: 0,
                borderTop: 1,
                borderColor: 'divider',
                p: 2,
                bgcolor: 'background.default',
              }}
            >
              <Box sx={{ maxWidth: '100%' }}>
                <ChatInput />
              </Box>
            </Box>
          </Box>

          {/* Right Panel - Analysis Visualization */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Visualization */}
            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {viewMode === 'linear' ? <LinearFlow isFullScreen={false} /> : <Graph3D />}
            </Box>

            {/* Problem List */}
            {problemList && problemList.length > 0 && (
              <Box
                sx={{
                  height: '250px',
                  borderTop: 1,
                  borderColor: 'divider',
                  overflow: 'auto',
                  bgcolor: 'background.paper',
                  p: 2,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Problem List ({problemList.length} items)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {problemList.map((problem: ProblemListItem, index: number) => (
                    <Box
                      key={problem.id}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'background.default',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {problem.diagnosis}
                        </Typography>
                        <Chip
                          label={`${Math.round(problem.likelihood * 100)}%`}
                          size="small"
                          color={problem.likelihood > 0.7 ? 'error' : problem.likelihood > 0.5 ? 'warning' : 'default'}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        ICD-10: {problem.icd10Code} • {problem.category}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            py: 1,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Container maxWidth="xl">
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
    </motion.div>
  );
};

export default AnalysisPage;
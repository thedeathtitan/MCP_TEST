import React from 'react';
import { Box, Typography, Paper, IconButton, Chip, Button } from '@mui/material';
import { ChatContainer } from '../components/ChatContainer';
import { ChatInput } from '../components/ChatInput';
import { Graph3D } from '../components/Graph3D';
import LinearFlow from '../components/LinearFlow';
import FullScreenToolbar from '../components/FullScreenToolbar';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewInAr, Timeline } from '@mui/icons-material';
import { useDiagStore } from '../store/diagStore';

const AppPage: React.FC = () => {
  const { 
    viewMode, 
    isFullScreen, 
    setViewMode, 
    setFullScreen,
    messages,
    graph
  } = useDiagStore();

  const hasAnalysis = graph.nodes.length > 0;

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
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <Paper 
          component="header" 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            position: 'sticky', 
            top: 0, 
            zIndex: 50,
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ maxWidth: 'md', mx: 'auto', px: 3, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'primary.main', 
                  borderRadius: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <Typography sx={{ color: 'white', fontSize: '1rem' }}>🧠</Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Diagnosis-Space
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Clinical AI Assistant
                  </Typography>
                </Box>
              </Box>

              {hasAnalysis && (
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
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Chat Interface */}
        <Box sx={{ flex: 1 }}>
          <ChatContainer>
            <ChatInput />
          </ChatContainer>
        </Box>

        {/* Analysis Viewer - appears after AI response */}
        {hasAnalysis && (
          <Box sx={{ 
            height: '60vh', 
            position: 'relative',
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <Box sx={{ position: 'absolute', inset: 0 }}>
              {viewMode === 'linear' ? <LinearFlow isFullScreen={false} /> : <Graph3D />}
            </Box>
            
            {/* Expand Button */}
            <IconButton
              onClick={() => setFullScreen(true)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': { boxShadow: 4 }
              }}
              title="Enter full-screen mode"
            >
              <ViewInAr />
            </IconButton>
          </Box>
        )}

        {/* Footer */}
        <Paper 
          component="footer" 
          sx={{ 
            borderTop: 1, 
            borderColor: 'divider', 
            bgcolor: 'background.paper',
            py: 1,
            textAlign: 'center'
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            ⚠️ Research & Education Only
          </Typography>
        </Paper>
      </Box>
    </motion.div>
  );
};

export default AppPage;
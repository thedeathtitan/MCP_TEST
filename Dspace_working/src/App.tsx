import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import theme from './theme';
import ChatPage from './pages/ChatPage';
import AnalysisPage from './pages/AnalysisPage';
import { useDiagStore } from './store/diagStore';

function App() {
  const { graph } = useDiagStore();
  const hasAnalysis = graph.nodes.length > 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ height: '100vh', overflow: 'hidden' }}>
          <Routes>
            <Route 
              path="/" 
              element={hasAnalysis ? <AnalysisPage /> : <ChatPage />} 
            />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Download,
  ViewInAr,
  Timeline
} from '@mui/icons-material';

interface FullScreenToolbarProps {
  isVisible: boolean;
  viewMode: 'linear' | '3d';
  onClose: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onDownload?: () => void;
  onToggleView?: () => void;
}

const FullScreenToolbar: React.FC<FullScreenToolbarProps> = ({
  isVisible,
  viewMode,
  onClose,
  onZoomIn,
  onZoomOut,
  onResetView,
  onDownload,
  onToggleView
}) => {
  const theme = useTheme();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`,
            }}
          >
            {/* Title */}
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                letterSpacing: '0.5px',
                px: 1
              }}
            >
              ANALYSIS VIEW
            </Typography>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* View Toggle */}
            <Tooltip title={`Switch to ${viewMode === 'linear' ? '3D' : 'Linear'} View`}>
              <IconButton
                size="small"
                onClick={onToggleView}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main'
                  }
                }}
              >
                {viewMode === 'linear' ? <ViewInAr fontSize="small" /> : <Timeline fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Zoom Controls */}
            <Tooltip title="Zoom In">
              <IconButton
                size="small"
                onClick={onZoomIn}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main'
                  }
                }}
              >
                <ZoomIn fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Zoom Out">
              <IconButton
                size="small"
                onClick={onZoomOut}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main'
                  }
                }}
              >
                <ZoomOut fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Reset View">
              <IconButton
                size="small"
                onClick={onResetView}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main'
                  }
                }}
              >
                <CenterFocusStrong fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Export */}
            <Tooltip title="Export Image">
              <IconButton
                size="small"
                onClick={onDownload}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main'
                  }
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Close Button */}
            <Tooltip title="Exit Full Screen (ESC)">
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: 'error.main'
                  }
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenToolbar;
import React from 'react';
import { Box, Typography, Avatar, CircularProgress } from '@mui/material';
import { Person, SmartToy } from '@mui/icons-material';
import type { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 3,
        width: '100%',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: isUser ? 'primary.main' : 'secondary.main',
          fontSize: '1rem',
          flexShrink: 0,
          mt: 0.5,
        }}
      >
        {isUser ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
      </Avatar>

      {/* Message Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Role Label */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 1,
            fontSize: '0.875rem',
          }}
        >
          {isUser ? 'You' : 'Medical AI Assistant'}
        </Typography>

        {/* Message Body */}
        <Box>
          {isStreaming && !message.content ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Analyzing clinical presentation...
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="body1"
              sx={{
                fontSize: '1rem',
                lineHeight: 1.6,
                color: 'text.primary',
                whiteSpace: 'pre-wrap',
                '& strong': {
                  fontWeight: 600,
                },
                '& em': {
                  fontStyle: 'italic',
                },
                '& h2': {
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  mt: 2,
                  mb: 1,
                },
                '& h3': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  mt: 1.5,
                  mb: 0.5,
                },
                '& ul': {
                  pl: 2,
                  mt: 1,
                  mb: 1,
                },
                '& li': {
                  mb: 0.5,
                },
              }}
            >
              {message.content}
            </Typography>
          )}

          {/* Streaming indicator */}
          {isStreaming && message.content && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={12} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Generating...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Timestamp */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 2,
            color: 'text.secondary',
            fontSize: '0.75rem',
          }}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Typography>
      </Box>
    </Box>
  );
}
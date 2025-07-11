import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useDiagStore } from '../store/diagStore';
import { MessageBubble } from './MessageBubble';

interface ChatContainerProps {
  children?: React.ReactNode;
}

export function ChatContainer({ children }: ChatContainerProps) {
  const { messages } = useDiagStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Messages Area */}
      <Box 
        sx={{ 
          flex: 1, 
          overflowY: 'auto',
          px: 2,
          py: 1,
        }}
      >
        <Box 
          sx={{ 
            maxWidth: '768px', 
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            py: 2,
          }}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* Input Area - only render if children provided */}
      {children}
    </Box>
  );
}
import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Position,
  BackgroundVariant,
  MarkerType
} from 'reactflow';
import type { Node, Edge, NodeTypes } from 'reactflow';
import { Box, Typography, Paper, Chip, useTheme, alpha, IconButton, Tooltip, Collapse, Badge } from '@mui/material';
import { ViewColumn, ViewStream, ExpandMore, ExpandLess, Warning, NotificationImportant } from '@mui/icons-material';
import { motion } from 'framer-motion';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

// Add pulse animation styles
const pulseKeyframes = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(211, 47, 47, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
    }
  }
`;

// Inject pulse animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = pulseKeyframes;
  document.head.appendChild(style);
}

import { useDiagStore } from '../store/diagStore';
import type { DiagnosisNode, Swimlane, MedicalSwimlane, MedicalSwimlaneCategory } from '../types';

// Custom Node Components following Linear's design principles
const DiagnosisNodeComponent = ({ data }: { data: DiagnosisNode['data'] }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 2,
          minWidth: 200,
          maxWidth: 280,
          border: `2px solid ${theme.palette.primary.main}`,
          borderRadius: 2,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
          '&:hover': {
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: theme.palette.primary.main
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            DIAGNOSIS
          </Typography>
          {data.likelihood && (
            <Chip
              label={`${Math.round(data.likelihood * 100)}%`}
              size="small"
              sx={{
                height: 18,
                fontSize: '10px',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main
              }}
            />
          )}
        </Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'text.primary',
            mb: 1
          }}
        >
          {data.label}
        </Typography>
        {data.details && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '12px',
              lineHeight: 1.4
            }}
          >
            {data.details.substring(0, 80)}...
          </Typography>
        )}
      </Paper>
    </motion.div>
  );
};

const ActionNodeComponent = ({ data }: { data: DiagnosisNode['data'] }) => {
  const theme = useTheme();
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      default: return theme.palette.success.main;
    }
  };

  const priorityColor = getPriorityColor(data.priority || 'low');

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Paper
        sx={{
          p: 2,
          minWidth: 180,
          maxWidth: 260,
          border: `2px solid ${priorityColor}`,
          borderRadius: 2,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          boxShadow: `0 8px 32px ${alpha(priorityColor, 0.2)}`,
          '&:hover': {
            boxShadow: `0 12px 40px ${alpha(priorityColor, 0.3)}`,
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '2px',
              bgcolor: priorityColor
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {data.priority?.toUpperCase() || 'ACTION'}
          </Typography>
          {data.timing && (
            <Chip
              label={data.timing}
              size="small"
              sx={{
                height: 18,
                fontSize: '10px',
                bgcolor: alpha(priorityColor, 0.1),
                color: priorityColor
              }}
            />
          )}
        </Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'text.primary',
            mb: 1
          }}
        >
          {data.label}
        </Typography>
        {data.category && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '12px',
              textTransform: 'capitalize'
            }}
          >
            {data.category}
          </Typography>
        )}
      </Paper>
    </motion.div>
  );
};

// Priority Actions Container Component
const PriorityActionsContainer = ({ data }: { data: { priorityNodeCount: number } }) => {
  const theme = useTheme();
  const { priorityNodeCount } = data;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box
        sx={{
          width: '100%',
          height: 180,
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)}, ${alpha(theme.palette.warning.main, 0.05)})`,
          border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          mb: 2
        }}
      >
        {/* Priority Section Header */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 50,
            background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)}, ${alpha(theme.palette.error.main, 0.1)})`,
            borderBottom: `2px solid ${alpha(theme.palette.error.main, 0.3)}`,
            display: 'flex',
            alignItems: 'center',
            px: 3
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: theme.palette.error.main,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography sx={{ fontSize: '10px', color: 'white' }}>
              🚨
            </Typography>
          </Box>
          
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.error.main,
              fontSize: '18px',
              flex: 1
            }}
          >
            Priority Actions
          </Typography>
          
          <Badge
            badgeContent={priorityNodeCount}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '12px',
                fontWeight: 600
              }
            }}
          >
            <Box sx={{ width: 24, height: 24 }} />
          </Badge>
        </Box>
        
        {/* Priority Actions Content Area */}
        <Box
          sx={{
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            bottom: 0,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {priorityNodeCount === 0 ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  mb: 1
                }}
              >
                No high-priority actions identified
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  opacity: 0.7,
                  fontSize: '11px'
                }}
              >
                Critical and high-priority items will appear here
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.error.main,
                  fontSize: '11px',
                  fontWeight: 600,
                  opacity: 0.8
                }}
              >
                {priorityNodeCount} high-priority item{priorityNodeCount > 1 ? 's' : ''} displayed above
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};

// Enhanced Medical Swimlane Component with Collapsible Functionality and Better Visual Feedback
const MedicalSwimlaneComponent = ({ data, nodeCount = 0, onToggleCollapse }: { 
  data: MedicalSwimlane; 
  nodeCount?: number; 
  onToggleCollapse?: () => void; 
}) => {
  const theme = useTheme();
  const isCollapsed = data.isCollapsed;
  const isCritical = data.category === 'CRITICAL';
  const hasContent = nodeCount > 0;
  const isEmpty = nodeCount === 0;
  
  const getAttentionIcon = () => {
    if (isCritical && hasContent) return <Warning sx={{ color: '#ff5722', fontSize: '20px' }} />;
    if (hasContent) return <NotificationImportant sx={{ color: '#ff9800', fontSize: '18px' }} />;
    return null;
  };
  
  const getEmptyStateMessage = () => {
    if (isEmpty && !isCollapsed) {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            opacity: 0.6
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            No items in this category
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box
        sx={{
          width: '100%',
          height: isCollapsed ? '70px' : '100%', // Slightly taller for better visibility
          background: hasContent 
            ? alpha(data.color, 0.1)
            : alpha(theme.palette.grey[100], 0.05),
          border: hasContent
            ? `2px solid ${alpha(data.color, 0.3)}`
            : `1px dashed ${alpha(theme.palette.grey[400], 0.3)}`,
          borderRadius: 3, // More rounded
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: hasContent 
              ? `0 4px 12px ${alpha(data.color, 0.2)}`
              : `0 4px 12px ${alpha(theme.palette.grey[400], 0.15)}`,
          },
          ...(isEmpty && {
            opacity: 0.6
          })
        }}
      >
        {/* Swimlane Header */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 70, // Match the increased height
            background: hasContent 
              ? `linear-gradient(135deg, ${alpha(data.color, 0.18)}, ${alpha(data.color, 0.12)})`
              : `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.1)}, ${alpha(theme.palette.grey[300], 0.05)})`,
            borderBottom: hasContent 
              ? `2px solid ${alpha(data.color, 0.4)}`
              : `1px solid ${alpha(theme.palette.grey[400], 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            px: 3,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: hasContent 
                ? `linear-gradient(135deg, ${alpha(data.color, 0.22)}, ${alpha(data.color, 0.15)})`
                : `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.15)}, ${alpha(theme.palette.grey[300], 0.08)})`,
            }
          }}
          onClick={onToggleCollapse}
        >
          {/* Priority Icon */}
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: data.color,
              mr: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography sx={{ fontSize: '10px', color: 'white' }}>
              {data.icon}
            </Typography>
          </Box>
          
          {/* Title */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: '16px',
              flex: 1
            }}
          >
            {data.title}
          </Typography>
          
          {/* Expanded state indicator */}
          {!isCollapsed && hasContent && (
            <Box sx={{ mr: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '11px',
                  color: alpha(data.color, 0.8),
                  bgcolor: alpha(data.color, 0.1),
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 600
                }}
              >
                EXPANDED
              </Typography>
            </Box>
          )}
          
          {/* Attention Badge */}
          {getAttentionIcon()}
          
          {/* Node Count Badge */}
          {hasContent ? (
            <Badge
              badgeContent={nodeCount}
              color={isCritical ? 'error' : 'primary'}
              sx={{
                mx: 1,
                '& .MuiBadge-badge': {
                  fontSize: '12px',
                  fontWeight: 600
                }
              }}
            >
              <Box sx={{ width: 20, height: 20 }} />
            </Badge>
          ) : (
            <Chip
              label="Empty"
              size="small"
              sx={{
                mx: 1,
                height: 20,
                fontSize: '10px',
                bgcolor: alpha(theme.palette.grey[400], 0.2),
                color: theme.palette.grey[600]
              }}
            />
          )}
          
          {/* Expand/Collapse Button */}
          <IconButton
            size="small"
            sx={{
              color: hasContent ? data.color : 'text.secondary',
              bgcolor: alpha(data.color, isCollapsed ? 0.05 : 0.1),
              border: `1px solid ${alpha(data.color, 0.2)}`,
              '&:hover': {
                bgcolor: alpha(data.color, 0.15),
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {isCollapsed ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
        </Box>
        
        {/* Swimlane Body - Always present but content controlled by layout */}
        <Box
          sx={{
            position: 'absolute',
            top: 70, // Match new header height
            left: 0,
            right: 0,
            bottom: 0,
            p: 2,
            minHeight: isCollapsed ? '0px' : '200px',
            maxHeight: isCollapsed ? '0px' : 'none',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            background: hasContent && !isCollapsed
              ? 'transparent'
              : isCollapsed
              ? 'transparent'
              : `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.3)}, ${alpha(theme.palette.grey[50], 0.1)})`
          }}
        >
          {/* Content area for child nodes - nodes are positioned by React Flow */}
          {!isCollapsed && !hasContent && getEmptyStateMessage()}
        </Box>
        
        {/* Collapsed State Info */}
        {isCollapsed && (
          <Box
            sx={{
              position: 'absolute',
              top: 42, // Adjusted for new height
              left: 20,
              right: 20,
              fontSize: '13px',
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {hasContent ? (
                <>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: data.color,
                      opacity: 0.8
                    }}
                  />
                  <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 500 }}>
                    {nodeCount} item{nodeCount > 1 ? 's' : ''}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" sx={{ fontSize: '14px', opacity: 0.6 }}>
                  No items
                </Typography>
              )}
            </Box>
            <Typography variant="caption" sx={{ fontSize: '12px', opacity: 0.8, fontWeight: 500 }}>
              Click to {isCollapsed ? 'expand' : 'collapse'}
            </Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

// Legacy Swimlane Group Component (for backward compatibility)
const SwimlaneGroupComponent = ({ data }: { data: Swimlane }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          background: alpha(data.color || theme.palette.primary.main, 0.08),
          border: `1px solid ${alpha(data.color || theme.palette.primary.main, 0.2)}`,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 40,
            background: `linear-gradient(135deg, ${alpha(data.color || theme.palette.primary.main, 0.15)}, ${alpha(data.color || theme.palette.primary.main, 0.1)})`,
            borderBottom: `1px solid ${alpha(data.color || theme.palette.primary.main, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            px: 2
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: data.color || theme.palette.primary.main,
              mr: 1
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              fontSize: '14px'
            }}
          >
            {data.title}
          </Typography>
        </Box>
        
        <Box
          sx={{
            position: 'absolute',
            top: 40,
            left: 0,
            right: 0,
            bottom: 0,
            p: 2
          }}
        >
          {/* This area will contain the child nodes */}
        </Box>
      </Box>
    </motion.div>
  );
};

// Custom node types
const nodeTypes: NodeTypes = {
  diagnosis: DiagnosisNodeComponent,
  next_action: ActionNodeComponent,
  swimlane: SwimlaneGroupComponent,
  medical_swimlane: MedicalSwimlaneComponent,
  priority_container: PriorityActionsContainer
};

// NEW: Two-Section Layout - Priority Actions + Medical Categories
const getTwoSectionLayout = (nodes: Node[], edges: Edge[], medicalSwimlanes: MedicalSwimlane[] = []) => {
  console.log('🎯 Starting two-section layout with', nodes.length, 'nodes');
  
  const allLayoutNodes: Node[] = [];
  const priorityAreaHeight = 220;
  const sectionSpacing = 40;
  const swimlaneHeight = 80; // Reduced for collapsed state
  const swimlaneSpacing = 15;
  
  // Step 1: Separate nodes by priority
  const priorityNodes = nodes.filter(node => 
    node.data.priority === 'CRITICAL' || node.data.priority === 'HIGH'
  );
  const categoryNodes = nodes.filter(node => 
    node.data.priority !== 'CRITICAL' && node.data.priority !== 'HIGH'
  );
  
  console.log(`🚨 Priority nodes: ${priorityNodes.length}, 📋 Category nodes: ${categoryNodes.length}`);
  
  // Step 2: Create Priority Actions Container
  const priorityContainer: Node = {
    id: 'priority-actions-container',
    type: 'priority_container',
    position: { x: 0, y: 0 },
    data: {
      priorityNodeCount: priorityNodes.length
    },
    style: {
      width: 1200,
      height: priorityAreaHeight,
      zIndex: -1
    },
    selectable: false,
    draggable: false
  };
  
  allLayoutNodes.push(priorityContainer);
  
  // Step 3: Position Priority Nodes
  if (priorityNodes.length > 0) {
    const priorityGraph = new dagre.graphlib.Graph();
    priorityGraph.setDefaultEdgeLabel(() => ({}));
    priorityGraph.setGraph({ rankdir: 'LR', ranksep: 120, nodesep: 80 });
    
    // Add priority nodes to graph
    priorityNodes.forEach(node => {
      priorityGraph.setNode(node.id, { width: 280, height: 140 });
    });
    
    // Add edges between priority nodes
    edges.forEach(edge => {
      const sourceInPriority = priorityNodes.find(n => n.id === edge.source);
      const targetInPriority = priorityNodes.find(n => n.id === edge.target);
      
      if (sourceInPriority && targetInPriority) {
        priorityGraph.setEdge(edge.source, edge.target);
      }
    });
    
    dagre.layout(priorityGraph);
    
    // Position priority nodes in the top section
    priorityNodes.forEach(node => {
      const nodePosition = priorityGraph.node(node.id);
      
      allLayoutNodes.push({
        ...node,
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        position: {
          x: nodePosition.x - 140 + 80,
          y: nodePosition.y - 70 + 120 // Inside priority container
        }
      });
    });
  }
  
  // Step 4: Create Medical Category Swimlanes
  const startY = priorityAreaHeight + sectionSpacing;
  let currentY = startY;
  
  // Group category nodes by swimlane
  const nodesByLane = new Map<MedicalSwimlaneCategory, Node[]>();
  categoryNodes.forEach(node => {
    const swimlaneCategory = node.data.swimlane || 'DIAGNOSTIC';
    if (!nodesByLane.has(swimlaneCategory)) {
      nodesByLane.set(swimlaneCategory, []);
    }
    nodesByLane.get(swimlaneCategory)!.push(node);
  });
  
  // Create swimlane headers and organize nodes
  const visibleSwimlanes = medicalSwimlanes.filter(lane => lane.visible).sort((a, b) => a.priority - b.priority);
  
  // Add Medical Categories section header if there are category nodes
  if (categoryNodes.length > 0) {
    const categoriesHeader: Node = {
      id: 'medical-categories-header',
      type: 'medical_swimlane',
      position: { x: 0, y: currentY },
      data: {
        id: 'categories-header',
        category: 'HEADER' as MedicalSwimlaneCategory,
        title: '🏥 Medical Categories',
        icon: '🏥',
        color: '#1976d2',
        priority: 0,
        autoExpand: false,
        expandRules: [],
        isCollapsed: false,
        visible: true,
        description: 'Organized medical categories',
        nodeCount: categoryNodes.length
      },
      style: {
        width: 1200,
        height: 60,
        zIndex: 1
      },
      selectable: false,
      draggable: false
    };
    
    allLayoutNodes.push(categoriesHeader);
    currentY += 60 + swimlaneSpacing;
  }
  
  visibleSwimlanes.forEach((lane) => {
    const laneNodes = nodesByLane.get(lane.category) || [];
    
    // Create swimlane header node
    const swimlaneNode: Node = {
      id: `swimlane-header-${lane.id}`,
      type: 'medical_swimlane',
      position: { x: 0, y: currentY },
      data: {
        ...lane,
        nodeCount: laneNodes.length,
        isCollapsed: true // Start collapsed
      },
      style: {
        width: 1200,
        height: swimlaneHeight,
        zIndex: 1
      },
      selectable: false,
      draggable: false
    };
    
    allLayoutNodes.push(swimlaneNode);
    
    // Always position nodes, but they'll be hidden if lane is collapsed
    if (laneNodes.length > 0) {
      const laneGraph = new dagre.graphlib.Graph();
      laneGraph.setDefaultEdgeLabel(() => ({}));
      laneGraph.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 60 });
      
      laneNodes.forEach(node => {
        laneGraph.setNode(node.id, { width: 250, height: 120 });
      });
      
      // Add edges within this lane
      edges.forEach(edge => {
        const sourceInLane = laneNodes.find(n => n.id === edge.source);
        const targetInLane = laneNodes.find(n => n.id === edge.target);
        
        if (sourceInLane && targetInLane) {
          laneGraph.setEdge(edge.source, edge.target);
        }
      });
      
      dagre.layout(laneGraph);
      
      // Calculate expanded content height
      const expandedContentHeight = Math.max(200, Math.ceil(laneNodes.length / 4) * 160);
      
      // Position nodes within swimlane (they'll be hidden via style if collapsed)
      laneNodes.forEach(node => {
        const nodePosition = laneGraph.node(node.id);
        
        allLayoutNodes.push({
          ...node,
          targetPosition: Position.Left,
          sourcePosition: Position.Right,
          position: {
            x: nodePosition.x - 125 + 60,
            y: currentY + swimlaneHeight + nodePosition.y - 60 + 20
          },
          style: {
            ...node.style,
            // Hide nodes if their swimlane is collapsed with smooth animation
            opacity: lane.isCollapsed ? 0 : 1,
            transform: lane.isCollapsed ? 'scale(0.9)' : 'scale(1)',
            pointerEvents: lane.isCollapsed ? 'none' : 'auto',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: lane.isCollapsed ? -1 : 1
          }
        });
      });
      
      // Update swimlane height based on expand state
      if (!lane.isCollapsed) {
        // Update the swimlane node to expanded height
        swimlaneNode.style = {
          ...swimlaneNode.style,
          height: swimlaneHeight + expandedContentHeight
        };
        currentY += swimlaneHeight + expandedContentHeight + swimlaneSpacing;
      } else {
        currentY += swimlaneHeight + swimlaneSpacing;
      }
    } else {
      // Just move to next swimlane
      currentY += swimlaneHeight + swimlaneSpacing;
    }
    
    console.log(`🏊 Created ${lane.category} swimlane at y=${currentY - swimlaneHeight}, nodes=${laneNodes.length}, collapsed=${lane.isCollapsed}`);
  });
  
  console.log(`✅ Two-section layout complete: ${allLayoutNodes.length} total nodes`);
  
  return {
    nodes: allLayoutNodes,
    edges
  };
};

// Legacy layout function for backward compatibility
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR', swimlaneEnabled = false, swimlanes: Swimlane[] = []) => {
  if (!swimlaneEnabled) {
    // Use original layout logic when swimlanes are disabled
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 250, height: 120 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        position: {
          x: nodeWithPosition.x - 125,
          y: nodeWithPosition.y - 60,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  // Swimlane layout logic
  const swimlaneNodes: Node[] = [];
  const medicalNodes: Node[] = [];
  const laneHeight = 300;
  const laneWidth = 800;
  const laneSpacing = 50;
  let currentY = 0;

  // Create swimlane group nodes
  const visibleSwimlanes = swimlanes.filter(lane => lane.visible).sort((a, b) => a.order - b.order);
  
  visibleSwimlanes.forEach((lane) => {
    const laneNode: Node = {
      id: `swimlane-${lane.id}`,
      type: 'swimlane',
      position: { x: 0, y: currentY },
      data: {
        title: lane.title,
        color: lane.color,
        category: lane.category
      },
      style: {
        width: laneWidth,
        height: laneHeight,
        zIndex: -1 // Behind medical nodes
      },
      selectable: false,
      draggable: false
    };
    
    swimlaneNodes.push(laneNode);
    currentY += laneHeight + laneSpacing;
  });

  // Group medical nodes by swimlane
  const nodesByLane = new Map<string, Node[]>();
  
  nodes.forEach(node => {
    const swimlaneId = node.data.swimlane || 'diagnostic'; // Default to diagnostic
    if (!nodesByLane.has(swimlaneId)) {
      nodesByLane.set(swimlaneId, []);
    }
    nodesByLane.get(swimlaneId)!.push(node);
  });

  // Layout nodes within each swimlane
  visibleSwimlanes.forEach((lane, laneIndex) => {
    const laneNodes = nodesByLane.get(lane.id) || [];
    
    if (laneNodes.length === 0) return;

    // Create a sub-graph for this swimlane
    const laneGraph = new dagre.graphlib.Graph();
    laneGraph.setDefaultEdgeLabel(() => ({}));
    laneGraph.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 60 });

    // Add nodes to the lane graph
    laneNodes.forEach(node => {
      laneGraph.setNode(node.id, { width: 250, height: 120 });
    });

    // Add edges between nodes in this lane
    edges.forEach(edge => {
      const sourceInLane = laneNodes.find(n => n.id === edge.source);
      const targetInLane = laneNodes.find(n => n.id === edge.target);
      
      if (sourceInLane && targetInLane) {
        laneGraph.setEdge(edge.source, edge.target);
      }
    });

    dagre.layout(laneGraph);

    // Position nodes within the swimlane
    
    laneNodes.forEach(node => {
      const nodeWithPosition = laneGraph.node(node.id);
      
      const positionedNode: Node = {
        ...node,
        parentId: `swimlane-${lane.id}`,
        extent: 'parent' as const,
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        position: {
          x: nodeWithPosition.x - 125 + 50, // Add padding from lane edge
          y: nodeWithPosition.y - 60 + 80, // Add padding from lane top (header height)
        },
      };
      
      medicalNodes.push(positionedNode);
    });
  });

  return { 
    nodes: [...swimlaneNodes, ...medicalNodes], 
    edges 
  };
};

interface LinearFlowProps {
  isFullScreen?: boolean;
}

const LinearFlow: React.FC<LinearFlowProps> = ({ isFullScreen = false }) => {
  const theme = useTheme();
  const { graph, medicalSwimlanes, toggleSwimlaneCollapse } = useDiagStore();

  // Convert graph data to React Flow format
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = graph.nodes.map((node: DiagnosisNode) => ({
      id: node.id,
      type: node.data.type === 'diagnosis' ? 'diagnosis' : 'next_action',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        ...node.data,
        label: node.data.label
      }
    }));

    const edges: Edge[] = graph.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: theme.palette.primary.main,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: theme.palette.primary.main,
      },
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [graph, theme]);

  // Apply two-section layout (Priority Actions + Medical Categories)
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getTwoSectionLayout(initialNodes, initialEdges, medicalSwimlanes);
  }, [initialNodes, initialEdges, medicalSwimlanes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Handle swimlane collapse/expand
  const handleSwimlaneToggle = React.useCallback((swimlaneId: string) => {
    toggleSwimlaneCollapse(swimlaneId);
  }, [toggleSwimlaneCollapse]);

  // Update nodes when data changes
  React.useEffect(() => {
    console.log('🔄 LinearFlow: Updating layout due to data change');
    console.log('  - Initial nodes:', initialNodes.length);
    console.log('  - Initial edges:', initialEdges.length);
    console.log('  - Medical swimlanes:', medicalSwimlanes.length);
    
    const { nodes: newLayoutedNodes, edges: newLayoutedEdges } = getTwoSectionLayout(initialNodes, initialEdges, medicalSwimlanes);
    
    // Add toggle handlers to medical swimlane nodes
    const nodesWithHandlers = newLayoutedNodes.map(node => {
      if (node.type === 'medical_swimlane') {
        return {
          ...node,
          data: {
            ...node.data,
            onToggleCollapse: () => handleSwimlaneToggle(node.data.id)
          }
        };
      }
      return node;
    });
    
    console.log('✅ LinearFlow: Setting', nodesWithHandlers.length, 'nodes and', newLayoutedEdges.length, 'edges');
    setNodes(nodesWithHandlers);
    setEdges(newLayoutedEdges);
  }, [initialNodes, initialEdges, medicalSwimlanes, setNodes, setEdges, handleSwimlaneToggle]);

  if (graph.nodes.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          opacity: 0.6
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2
          }}
        >
          <Typography sx={{ fontSize: '28px' }}>📊</Typography>
        </Box>
        <Typography variant="h6" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Analysis Visualization
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 300 }}>
          Enter a clinical note and run AI analysis to see the diagnostic flow chart here
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }}
        attributionPosition="bottom-left"
        style={{
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.02)} 50%, ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={alpha(theme.palette.divider, 0.3)}
        />
        <Controls
          style={{
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'diagnosis') return theme.palette.primary.main;
            return theme.palette.success.main;
          }}
          nodeStrokeWidth={2}
          style={{
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
          }}
        />
      </ReactFlow>

      {/* Flow Statistics */}
      {!isFullScreen && nodes.length > 0 && (
        <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
          <Paper sx={{ p: 2, opacity: 0.9 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              FLOW ANALYSIS
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant="caption">
                  {nodes.filter(n => n.type === 'diagnosis').length} Diagnoses
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: 'success.main' }} />
                <Typography variant="caption">
                  {nodes.filter(n => n.type === 'next_action').length} Actions
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Swimlane Controls */}
      {!isFullScreen && nodes.length > 0 && (
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Expand/Collapse All Controls */}
          <Paper sx={{ p: 1.5, opacity: 0.95 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
              SWIMLANE CONTROLS
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Expand all medical categories" arrow placement="bottom">
                <Chip
                  label="Expand All"
                  size="small"
                  onClick={() => {
                    medicalSwimlanes.forEach(lane => {
                      if (lane.isCollapsed) {
                        toggleSwimlaneCollapse(lane.id);
                      }
                    });
                  }}
                  sx={{
                    fontSize: '10px',
                    height: 24,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                />
              </Tooltip>
              <Tooltip title="Collapse all medical categories" arrow placement="bottom">
                <Chip
                  label="Collapse All"
                  size="small"
                  onClick={() => {
                    medicalSwimlanes.forEach(lane => {
                      if (!lane.isCollapsed) {
                        toggleSwimlaneCollapse(lane.id);
                      }
                    });
                  }}
                  sx={{
                    fontSize: '10px',
                    height: 24,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.warning.main, 0.2),
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                />
              </Tooltip>
            </Box>
          </Paper>
          
          {/* Medical Swimlane Info */}
          <Paper sx={{ p: 2, opacity: 0.9, minWidth: 200 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              MEDICAL CATEGORIES
            </Typography>
            <Box sx={{ mt: 1 }}>
              {medicalSwimlanes.filter(lane => lane.visible).map(lane => {
                const laneNodes = nodes.filter(n => n.data.swimlane === lane.category);
                return (
                  <Box key={lane.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: lane.color,
                      opacity: lane.isCollapsed ? 0.5 : 1
                    }} />
                    <Typography variant="caption" sx={{ 
                      flex: 1, 
                      fontSize: '11px',
                      opacity: lane.isCollapsed ? 0.7 : 1,
                      textDecoration: lane.isCollapsed ? 'line-through' : 'none'
                    }}>
                      {lane.title}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 600 }}>
                      {laneNodes.length}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '10px', opacity: 0.6 }}>
                      {lane.isCollapsed ? '●' : '○'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default LinearFlow;
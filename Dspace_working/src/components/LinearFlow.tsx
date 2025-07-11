import React, { useCallback, useMemo } from 'react';
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
import { Box, Typography, Paper, Chip, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import { useDiagStore } from '../store/diagStore';
import type { DiagnosisNode } from '../types';

// Custom Node Components following Linear's design principles
const DiagnosisNodeComponent = ({ data }: { data: any }) => {
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

const ActionNodeComponent = ({ data }: { data: any }) => {
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

// Custom node types
const nodeTypes: NodeTypes = {
  diagnosis: DiagnosisNodeComponent,
  next_action: ActionNodeComponent
};

// Layout function using Dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
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
};

interface LinearFlowProps {
  isFullScreen?: boolean;
}

const LinearFlow: React.FC<LinearFlowProps> = ({ isFullScreen = false }) => {
  const theme = useTheme();
  const { graph } = useDiagStore();

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

  // Apply layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges);
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes when data changes
  React.useEffect(() => {
    const { nodes: newLayoutedNodes, edges: newLayoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(newLayoutedNodes);
    setEdges(newLayoutedEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

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
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-left"
        style={{
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
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
    </Box>
  );
};

export default LinearFlow;
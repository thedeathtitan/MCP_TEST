import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Box as MUIBox, Typography, Paper, Button } from '@mui/material';
import { useDiagStore } from '../store/diagStore';
import type { DiagnosisNode, DiagnosisEdge, NodeType } from '../types';
import * as THREE from 'three';

interface Node3D {
  id: string;
  position: [number, number, number];
  data: {
    label: string;
    type: string;
    likelihood?: number;
    confidence?: number;
    priority?: string;
    category?: string;
    details?: string;
    evidence?: string[];
    timing?: string;
  };
}

// 3D Node Component
function Node3D({ node, onClick, isSelected }: { 
  node: Node3D; 
  onClick: (node: Node3D) => void;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animate rotation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (isSelected) {
        meshRef.current.rotation.x += 0.02;
      }
    }
  });

  // Get node properties based on type
  const { color, size } = useMemo(() => {
    const { type, likelihood = 0.5, confidence = 0.5, priority } = node.data;
    
    let color = '#007acc';
    let baseSize = 1;

    if (type === 'diagnosis') {
      color = '#007acc';
      const probability = (likelihood + confidence) / 2;
      baseSize = 0.8 + probability * 1.2; // 0.8 to 2.0
    } else if (type === 'next_action') {
      color = '#10b981';
      if (priority === 'urgent') {
        color = '#ef4444';
        baseSize = 1.5;
      } else if (priority === 'high') {
        color = '#f97316';
        baseSize = 1.3;
      } else if (priority === 'medium') {
        color = '#eab308';
        baseSize = 1.1;
      } else {
        baseSize = 0.9;
      }
    } else if (type === 'completed') {
      color = '#60a5fa';
      baseSize = 0.8 + (likelihood || 0.5) * 1.0;
    }

    return {
      color: hovered || isSelected ? '#ffffff' : color,
      size: baseSize * (hovered ? 1.2 : 1)
    };
  }, [node.data, hovered, isSelected]);

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    onClick(node);
  }, [node, onClick]);

  return (
    <group position={node.position}>
      {/* 3D Geometry */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={size}
      >
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={isSelected ? '#333333' : '#000000'}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* Floating Label */}
      <Html position={[0, size + 0.5, 0]} center>
        <MUIBox
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textAlign: 'center',
            maxWidth: '120px',
            wordWrap: 'break-word',
            pointerEvents: 'none'
          }}
        >
          {node.data.label}
        </MUIBox>
      </Html>

      {/* Selection Ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.2, size * 1.4, 32]} />
          <meshBasicMaterial color="#007acc" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

// 3D Scene Component
function Scene3D() {
  const { graph } = useDiagStore();
  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null);

  // Convert 2D graph data to 3D positions
  const nodes3D = useMemo(() => {
    return graph.nodes.map((node, index) => {
      // Create 3D spiral layout
      const angle = (index * 2.5) % (Math.PI * 2);
      const radius = 3 + (index * 0.5);
      const height = Math.sin(index * 0.8) * 2;
      
      return {
        id: node.id,
        position: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        ] as [number, number, number],
        data: {
          ...node.data,
          type: node.data.type as string
        }
      };
    });
  }, [graph.nodes]);

  const handleNodeClick = useCallback((node: Node3D) => {
    setSelectedNode(node);
  }, []);

  return (
    <>
      {/* 3D Nodes */}
      {nodes3D.map(node => (
        <Node3D
          key={node.id}
          node={node}
          onClick={handleNodeClick}
          isSelected={selectedNode?.id === node.id}
        />
      ))}

      {/* Ambient and directional lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
    </>
  );
}

// Main Graph3D Component
export function Graph3D() {
  const resetCamera = useCallback(() => {
    // Camera reset functionality
  }, []);

  return (
    <MUIBox sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [10, 10, 10], fov: 75 }}
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <Scene3D />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
        />
      </Canvas>

      {/* UI Controls */}
      <MUIBox sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
        <Paper sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            3D Medical Graph
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={resetCamera}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Reset View
          </Button>
        </Paper>
      </MUIBox>

      {/* Legend */}
      <MUIBox sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
        <Paper sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Legend
          </Typography>
          <MUIBox sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <MUIBox sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MUIBox 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: '#007acc' 
                }} 
              />
              <Typography variant="caption">Diagnosis</Typography>
            </MUIBox>
            <MUIBox sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MUIBox 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  bgcolor: '#10b981' 
                }} 
              />
              <Typography variant="caption">Next Action</Typography>
            </MUIBox>
            <MUIBox sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MUIBox 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  bgcolor: '#60a5fa',
                  transform: 'rotate(45deg)'
                }} 
              />
              <Typography variant="caption">Completed</Typography>
            </MUIBox>
          </MUIBox>
        </Paper>
      </MUIBox>
    </MUIBox>
  );
} 
import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

interface MindMapProps {
  data: {
    root: MindMapNode;
  };
}

const nodeTypes = {};

const MindMap: React.FC<MindMapProps> = ({ data }) => {
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!data?.root) return { initialNodes: [], initialEdges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;

    const processNode = (
      node: MindMapNode,
      x: number,
      y: number,
      level: number,
      parentId?: string
    ): string => {
      const currentId = `node-${nodeId++}`;
      
      // Create node
      nodes.push({
        id: currentId,
        type: 'default',
        position: { x, y },
        data: { label: node.name },
        style: {
          background: level === 0 ? '#ff6b6b' : level === 1 ? '#4ecdc4' : '#95a5a6',
          color: 'white',
          fontWeight: level === 0 ? 'bold' : 'normal',
          fontSize: level === 0 ? '16px' : '14px',
          borderRadius: '8px',
          padding: '10px',
        },
      });

      // Create edge to parent
      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          type: 'smoothstep',
          animated: false,
        });
      }

      // Process children
      if (node.children && node.children.length > 0) {
        const childSpacing = 200;
        const startY = y - ((node.children.length - 1) * childSpacing) / 2;
        
        node.children.forEach((child, index) => {
          const childY = startY + index * childSpacing;
          const childX = x + 250;
          processNode(child, childX, childY, level + 1, currentId);
        });
      }

      return currentId;
    };

    // Start processing from root
    processNode(data.root, 0, 0, 0);

    return { initialNodes: nodes, initialEdges: edges };
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default MindMap;
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import './App.css';
import * as htmlToImage from 'html-to-image';

// Кастомный компонент для петлевых ребер
const LoopEdge = ({ id, sourceX, sourceY, markerEnd }) => {
  const radius = 20;
  const offset = 20;

  // Петля сбоку узла (справа)
  const path = `M ${sourceX},${sourceY - 5}
               L ${sourceX},${sourceY - radius}
               A ${radius} ${radius} 0 1 1 ${sourceX + radius},${sourceY - radius}
               L ${sourceX + radius},${sourceY - 5}`;

  return (
    <path
      id={id}
      d={path}
      markerEnd={markerEnd}
      style={{
        strokeWidth: 2,
        stroke: '#555',
        fill: 'none',
        zIndex: 10
      }}
    />
  );
};

function FlowComponent() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const flowRef = useRef(null);
  const { setNodes: setFlowNodes, setEdges: setFlowEdges } = useReactFlow();

  // Обработчики изменений
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({
      ...connection,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#555',
        orient: 'auto'
      },
      style: {
        strokeWidth: 2,
        stroke: '#555'
      }
    }, eds)),
    []
  );
  const exportToPNG = () => {
    const flowElement = document.querySelector('.react-flow');
    htmlToImage.toPng(flowElement)
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'dag-export.png';
        link.href = dataUrl;
        link.click();
      });
  };
  // Загрузка графа из graph.json
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await axios.get('/api/graph'); // Или '/graph.json' для локального файла
        const { nodes: loadedNodes, edges: loadedEdges } = response.data;

        // Форматирование узлов
        const formattedNodes = loadedNodes.map(node => ({
          id: node.id,
          data: { label: node.label },
          position: node.position || { x: 0, y: 0 },
          style: {
            width: 60,
            height: 20,
            //border: '2px solid #555',
            borderRadius: 5,
            padding: 3,
            textAlign: 'center',
            fontsize: 10,
          }
        }));

        // Форматирование ребер с учетом петель
        const formattedEdges = loadedEdges.map(edge => {
          const isLoop = edge.source === edge.target;
          return {
            id: edge.id || `${edge.source}-${edge.target}-${Math.random().toString(36).substr(2, 5)}`,
            source: edge.source,
            target: edge.target,
            type: isLoop ? 'loop' : 'default',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 10,
              height: 10,
              color: '#555',
              orient: 'auto',
            },
            style: {
              strokeWidth: 2,
              stroke: '#555'
            }
          };
        });

        setNodes(formattedNodes);
        setEdges(formattedEdges);
      } catch (error) {
        console.error('Ошибка загрузки графа:', error);
        // Запасные данные для демонстрации
        setNodes([{
          id: 'node-1',
          data: { label: 'Пример узла' },
          position: { x: 100, y: 100 }
        }]);
        setEdges([]);
      }
    };
    fetchGraphData();
  }, []);

  // Синхронизация с React Flow
  useEffect(() => {
    setFlowNodes(nodes);
    setFlowEdges(edges);
  }, [nodes, edges, setFlowNodes, setFlowEdges]);

  return (
    <div style={{ height: '100vh', width: '100vw' }} ref={flowRef}>
      <button
        onClick={exportToPNG}
        style={{ position: 'absolute', top: 50, left: 10, zIndex: 100 }}
      >
        Export PNG
      </button>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        edgeTypes={{ loop: LoopEdge }}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowComponent />
    </ReactFlowProvider>
  );
}
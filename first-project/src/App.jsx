import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import { Upload, Play, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api';

const initialNodes = [];
const initialEdges = [];

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [loading, setLoading] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [dryRunData, setDryRunData] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [error, setError] = useState(null);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/convert-flowchart`, formData);
      setNodes(response.data.nodes.map(n => ({
        ...n,
        style: { border: '1px solid #777', padding: '10px', borderRadius: '5px', background: '#fff' }
      })));
      setEdges(response.data.edges);
      setDryRunData(null);
      setCurrentStepIndex(-1);
    } catch (err) {
      console.error(err);
      setError('Failed to convert flowchart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startDryRun = async () => {
    if (nodes.length === 0) {
      setError('Please upload a flowchart first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/dry-run`, {
        flowchart: { nodes, edges },
        testInput
      });
      setDryRunData(response.data);
      setCurrentStepIndex(0);
      setSimulationRunning(true);
    } catch (err) {
      console.error(err);
      setError('Failed to start dry run. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (simulationRunning && dryRunData && currentStepIndex < dryRunData.steps.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (currentStepIndex >= (dryRunData?.steps.length || 0)) {
      setSimulationRunning(false);
    }
  }, [simulationRunning, currentStepIndex, dryRunData]);

  // Highlight current node
  useEffect(() => {
    if (dryRunData && currentStepIndex >= 0 && currentStepIndex < dryRunData.steps.length) {
      const currentNodeId = dryRunData.steps[currentStepIndex].nodeId;
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          style: {
            ...node.style,
            backgroundColor: node.id === currentNodeId ? '#3b82f6' : '#fff',
            color: node.id === currentNodeId ? '#fff' : '#000',
            borderColor: node.id === currentNodeId ? '#1d4ed8' : '#777',
            boxShadow: node.id === currentNodeId ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none',
          },
        }))
      );
    } else {
       setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          style: { ...node.style, backgroundColor: '#fff', color: '#000', boxShadow: 'none' },
        }))
      );
    }
  }, [currentStepIndex, dryRunData]);

  const currentStep = dryRunData?.steps[currentStepIndex] || (currentStepIndex >= dryRunData?.steps.length ? dryRunData.steps[dryRunData.steps.length - 1] : null);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FlowDry <span className="text-blue-500">AI</span></h1>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-all border border-slate-600">
            <Upload className="w-4 h-4" />
            <span>Upload Flowchart</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
          </label>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Inputs & Controls */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Simulation Inputs</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-slate-300">Test Input (e.g., n=5)</label>
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  rows="3"
                  placeholder="Enter inputs here..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                />
              </div>
              <button
                onClick={startDryRun}
                disabled={loading || nodes.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Start Dry Run
              </button>
            </div>
          </section>

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex gap-3 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {dryRunData && (
            <section className="flex-1 flex flex-col gap-4 min-h-0">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Execution Info</h2>

              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Variables</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {currentStep?.variables && Object.entries(currentStep.variables).map(([key, val]) => (
                        <div key={key} className="bg-slate-800 p-2 rounded border border-slate-700 flex justify-between">
                          <span className="text-blue-400 font-mono">{key}</span>
                          <span className="text-white font-mono">{JSON.stringify(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Explanation</span>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed italic">
                      {currentStep?.explanation || "Waiting to start..."}
                    </p>
                  </div>
                   <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Current Output</span>
                    <div className="mt-2 p-2 bg-black rounded font-mono text-green-400 text-xs min-h-[40px]">
                      {currentStep?.output || "> _"}
                    </div>
                  </div>
                </div>
              </div>

              {currentStepIndex >= dryRunData.steps.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-900/20 border border-green-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-green-400 mb-2 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Run Complete</span>
                  </div>
                  <div className="text-xs space-y-2">
                    <p><span className="text-slate-400">Accuracy:</span> <span className="text-white font-bold">{dryRunData.accuracyScore}%</span></p>
                    <p><span className="text-slate-400">Expected:</span> <span className="text-white">{dryRunData.expectedOutput}</span></p>
                    <p><span className="text-slate-400">Actual:</span> <span className="text-white">{dryRunData.actualOutput}</span></p>
                  </div>
                </motion.div>
              )}
            </section>
          )}
        </div>

        {/* Main Area - Flowchart */}
        <div className="flex-1 relative bg-slate-900">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            style={{ background: '#0f172a' }}
          >
            <Background color="#334155" gap={20} />
            <Controls />
          </ReactFlow>

          {/* Overlay for Mistake Explanation */}
          <AnimatePresence>
            {!simulationRunning && dryRunData && currentStepIndex >= dryRunData.steps.length && dryRunData.mistakeExplanation && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-8 right-8 w-80 bg-slate-800/95 backdrop-blur border border-blue-500/50 rounded-2xl p-6 shadow-2xl z-50"
              >
                <div className="flex items-center gap-2 text-blue-400 mb-4">
                  <Info className="w-5 h-5" />
                  <h3 className="font-bold">AI Analysis</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {dryRunData.mistakeExplanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

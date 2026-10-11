/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ActiveTab, Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { SimulatorControls } from './components/SimulatorControls';
import { MemoryVisualizer } from './components/MemoryVisualizer';
import { PageTableExplorer } from './components/PageTableExplorer';
import { AlgorithmComparison } from './components/AlgorithmComparison';
import { LearningCenter } from './components/LearningCenter';
import { ProjectPresentation } from './components/ProjectPresentation';
import { EventLog } from './components/EventLog';
import { MiniPageTable } from './components/MiniPageTable';
import { AlgorithmType, SimulationStep } from './types/vmm';
import { parseReferenceString, simulateAlgorithm, runAllAlgorithms } from './lib/algorithms';
import { PRESET_STRINGS, PresetString } from './lib/constants';
import {
  Columns2,
  Maximize2,
  Activity,
  Award,
  Sparkles,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [referenceString, setReferenceString] = useState<string>('7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3');
  const [frameCount, setFrameCount] = useState<number>(3);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('LRU');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(900); // 900ms
  const [dashboardLayout, setDashboardLayout] = useState<'split' | 'stacked'>('split');

  // Parsed pages
  const parsedPages = useMemo(() => {
    const res = parseReferenceString(referenceString);
    return res.length > 0 ? res : [7, 0, 1, 2, 0, 3];
  }, [referenceString]);

  // Unique pages
  const allUniquePages = useMemo(() => {
    return Array.from(new Set(parsedPages)).sort((a, b) => a - b);
  }, [parsedPages]);

  // Complete simulation trace
  const simulationResult = useMemo(() => {
    return simulateAlgorithm(parsedPages, frameCount, algorithm);
  }, [parsedPages, frameCount, algorithm]);

  // Tri-algorithm snapshot for sidebar
  const miniComparison = useMemo(() => {
    return runAllAlgorithms(parsedPages, frameCount);
  }, [parsedPages, frameCount]);

  const totalSteps = parsedPages.length;

  // Active step data
  const currentStepData: SimulationStep | null =
    currentStepIndex > 0 && currentStepIndex <= simulationResult.steps.length
      ? simulationResult.steps[currentStepIndex - 1]
      : null;

  // Dynamic live statistics
  const currentHits = currentStepData?.cumulativeHits ?? 0;
  const currentFaults = currentStepData?.cumulativeFaults ?? 0;
  const processedCount = currentStepIndex;
  const dynamicHitRatio = processedCount > 0 ? (currentHits / processedCount) * 100 : 0;
  const dynamicFaultRatio = processedCount > 0 ? (currentFaults / processedCount) * 100 : 0;

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStepIndex >= totalSteps) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const next = prev + 1;
        if (next >= totalSteps) {
          setIsPlaying(false);
        }
        return next;
      });
    }, simulationSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, totalSteps, simulationSpeed]);

  // Handlers
  const handlePlay = useCallback(() => {
    if (currentStepIndex >= totalSteps) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex, totalSteps]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleNextStep = useCallback(() => {
    setIsPlaying(false);
    if (currentStepIndex < totalSteps) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex, totalSteps]);

  const handlePrevStep = useCallback(() => {
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  const handleRunAll = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(totalSteps);
  }, [totalSteps]);

  const handleJumpToStep = useCallback(
    (stepIdx: number) => {
      setIsPlaying(false);
      const clamped = Math.max(0, Math.min(totalSteps, stepIdx));
      setCurrentStepIndex(clamped);
    },
    [totalSteps]
  );

  const handleReferenceStringChange = (val: string) => {
    setIsPlaying(false);
    setReferenceString(val);
    setCurrentStepIndex(0);
  };

  const handleFrameCountChange = (count: number) => {
    setIsPlaying(false);
    setFrameCount(count);
    setCurrentStepIndex(0);
  };

  const handleAlgorithmChange = (algo: AlgorithmType) => {
    setIsPlaying(false);
    setAlgorithm(algo);
    setCurrentStepIndex((prev) => Math.min(prev, totalSteps));
  };

  const handleSelectPreset = (preset: PresetString) => {
    setIsPlaying(false);
    setReferenceString(preset.sequence);
    setFrameCount(preset.frames);
    setCurrentStepIndex(0);
  };

  const handleQuickDemo = () => {
    setActiveTab('simulator');
    setReferenceString('7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3');
    setFrameCount(3);
    setAlgorithm('LRU');
    setCurrentStepIndex(0);
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  };

  // Keyboard navigation shortcuts (Space, ArrowRight, ArrowLeft, R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentStepIndex((prev) => Math.min(totalSteps, prev + 1));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentStepIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSteps]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Universal Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReset={handleReset}
        onQuickDemo={handleQuickDemo}
      />

      {/* 2. Main Application Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        {/* Persistent Dynamic Statistics Cards */}
        <StatsCards
          totalFrames={frameCount}
          hits={currentHits}
          faults={currentFaults}
          hitRatio={dynamicHitRatio}
          faultRatio={dynamicFaultRatio}
          algorithm={algorithm}
          currentStep={currentStepIndex}
          totalSteps={totalSteps}
        />

        {/* Tab 1: Memory Simulator (Interactive Engine) */}
        {activeTab === 'simulator' && (
          <div className="flex flex-col gap-5">
            {/* View Layout Toggle Bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Dashboard Mode:</span>
                <span>
                  {dashboardLayout === 'split'
                    ? 'Studio Split (Memory + Page Table + Feed)'
                    : 'Expanded Focus (Maximized Frames)'}
                </span>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  onClick={() => setDashboardLayout('split')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    dashboardLayout === 'split'
                      ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Show memory frames and synced page table side-by-side"
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Studio View</span>
                </button>
                <button
                  onClick={() => setDashboardLayout('stacked')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    dashboardLayout === 'stacked'
                      ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Full width stacked frames"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Full Focus</span>
                </button>
              </div>
            </div>

            {/* Main Interactive Controls */}
            <SimulatorControls
              referenceString={referenceString}
              onReferenceStringChange={handleReferenceStringChange}
              frameCount={frameCount}
              onFrameCountChange={handleFrameCountChange}
              algorithm={algorithm}
              onAlgorithmChange={handleAlgorithmChange}
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
              onReset={handleReset}
              onRunAll={handleRunAll}
              simulationSpeed={simulationSpeed}
              onSpeedChange={setSimulationSpeed}
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              onSelectPreset={handleSelectPreset}
              onScrubStep={handleJumpToStep}
            />

            {/* Split View vs Stacked View */}
            {dashboardLayout === 'split' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left 8 Columns: Memory Visualizer */}
                <div className="lg:col-span-8 flex flex-col gap-5">
                  <MemoryVisualizer
                    referenceList={parsedPages}
                    currentStepIndex={currentStepIndex}
                    currentStepData={currentStepData}
                    frameCount={frameCount}
                    algorithm={algorithm}
                    onJumpToStep={handleJumpToStep}
                    allSteps={simulationResult.steps}
                  />

                  <EventLog
                    steps={simulationResult.steps}
                    currentStepIndex={currentStepIndex}
                    onJumpToStep={handleJumpToStep}
                  />
                </div>

                {/* Right 4 Columns: Synced Companion Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  {/* Live Synced Mini Page Table */}
                  <MiniPageTable
                    currentFrames={currentStepData?.frames || []}
                    currentRequestedPage={
                      currentStepIndex > 0 ? parsedPages[currentStepIndex - 1] : null
                    }
                    allUniquePages={allUniquePages}
                    onOpenFullPageTable={() => setActiveTab('pagetable')}
                  />

                  {/* Tri-Algorithm Quick Performance Comparison */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Algorithm Benchmark
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {frameCount} Frames
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-amber-400 font-bold">FIFO</span>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-400 font-bold">
                            {miniComparison.fifo.totalFaults} Faults
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            ({miniComparison.fifo.hitRatio}% Hit)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-cyan-400 font-bold">LRU</span>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-400 font-bold">
                            {miniComparison.lru.totalFaults} Faults
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            ({miniComparison.lru.hitRatio}% Hit)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-violet-400 font-bold">Optimal</span>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-400 font-bold">
                            {miniComparison.optimal.totalFaults} Faults
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            ({miniComparison.optimal.hitRatio}% Hit)
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('comparison')}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-cyan-400 hover:text-cyan-300 transition-colors mt-1"
                    >
                      <span>Open Full Comparison & Chart</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <MemoryVisualizer
                  referenceList={parsedPages}
                  currentStepIndex={currentStepIndex}
                  currentStepData={currentStepData}
                  frameCount={frameCount}
                  algorithm={algorithm}
                  onJumpToStep={handleJumpToStep}
                  allSteps={simulationResult.steps}
                />

                <EventLog
                  steps={simulationResult.steps}
                  currentStepIndex={currentStepIndex}
                  onJumpToStep={handleJumpToStep}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Page Table & Address Translation Explorer */}
        {activeTab === 'pagetable' && (
          <div className="flex flex-col gap-6">
            <PageTableExplorer
              currentFrames={currentStepData?.frames || []}
              currentRequestedPage={
                currentStepIndex > 0 ? parsedPages[currentStepIndex - 1] : null
              }
              allUniquePages={allUniquePages}
              currentStepIndex={currentStepIndex}
            />

            {/* Quick simulation stepper bar to advance page table without leaving tab */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
              <span className="text-xs text-slate-400 font-mono">
                Simulation Step: <strong className="text-cyan-300">#{currentStepIndex}</strong> of {totalSteps}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStepIndex <= 0}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                >
                  Step Backward
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={currentStepIndex >= totalSteps}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold disabled:opacity-40 transition-colors"
                >
                  Step Forward
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Algorithm Comparison & Bélády Anomaly */}
        {activeTab === 'comparison' && (
          <AlgorithmComparison
            referenceList={parsedPages}
            frameCount={frameCount}
          />
        )}

        {/* Tab 4: Interactive Learning Center */}
        {activeTab === 'learning' && <LearningCenter />}

        {/* Tab 5: Academic Project Presentation & Viva Guide */}
        {activeTab === 'presentation' && (
          <ProjectPresentation
            currentAlgorithm={algorithm}
            currentResult={simulationResult}
            referenceString={referenceString}
            frameCount={frameCount}
          />
        )}
      </main>

      {/* 3. Clean Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VMM Studio · Virtual Memory Management & Paging Simulator</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Shortcuts: Space (Play/Pause) · ←/→ (Step) · R (Reset)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

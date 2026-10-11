import { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  Sparkles,
  Gauge,
  HelpCircle,
  Keyboard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AlgorithmType } from '../types/vmm';
import { PRESET_STRINGS, PresetString } from '../lib/constants';

interface SimulatorControlsProps {
  referenceString: string;
  onReferenceStringChange: (val: string) => void;
  frameCount: number;
  onFrameCountChange: (count: number) => void;
  algorithm: AlgorithmType;
  onAlgorithmChange: (algo: AlgorithmType) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onReset: () => void;
  onRunAll: () => void;
  simulationSpeed: number; // in milliseconds
  onSpeedChange: (speed: number) => void;
  currentStepIndex: number;
  totalSteps: number;
  onSelectPreset: (preset: PresetString) => void;
  onScrubStep?: (step: number) => void;
}

export function SimulatorControls({
  referenceString,
  onReferenceStringChange,
  frameCount,
  onFrameCountChange,
  algorithm,
  onAlgorithmChange,
  isPlaying,
  onPlay,
  onPause,
  onNextStep,
  onPrevStep,
  onReset,
  onRunAll,
  simulationSpeed,
  onSpeedChange,
  currentStepIndex,
  totalSteps,
  onSelectPreset,
  onScrubStep,
}: SimulatorControlsProps) {
  const [inputError, setInputError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const handleInputChange = (val: string) => {
    onReferenceStringChange(val);
    const cleaned = val.replace(/[^0-9,\s]/g, '');
    if (cleaned !== val) {
      setInputError('Only numbers separated by commas or spaces are allowed');
    } else {
      setInputError(null);
    }
  };

  const generateRandomString = () => {
    const length = 12;
    const pages = Array.from({ length }, () => Math.floor(Math.random() * 8));
    onReferenceStringChange(pages.join(', '));
  };

  const isAtStart = currentStepIndex <= 0;
  const isAtEnd = currentStepIndex >= totalSteps;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col gap-4">
      {/* Quick Start Guide Banner (Toggleable) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Simulation Control Console
          </span>
          <span className="text-slate-400 text-xs hidden sm:inline">
            · Configure parameters & step through memory operations
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showGuide ? 'Hide Guide' : 'How To Use'}</span>
          {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showGuide && (
        <div className="bg-slate-950 border border-cyan-900/40 rounded-lg p-3 text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-cyan-300 flex items-center gap-1">
              1. Choose Input
            </span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Pick a preset (like <em>Textbook</em> or <em>Bélády’s Anomaly</em>) or type your own comma-separated pages.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-cyan-300 flex items-center gap-1">
              2. Select Algorithm
            </span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Toggle between <strong>FIFO</strong>, <strong>LRU</strong>, and <strong>Optimal</strong> with 1 click to compare replacement policies.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-cyan-300 flex items-center gap-1">
              3. Run or Step
            </span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Press <strong>Next</strong> or <strong>Play</strong> (or use keyboard shortcuts <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">Space</kbd> / <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">→</kbd>).
            </span>
          </div>
        </div>
      )}

      {/* Row 1: Primary Inputs & 1-Click Segmented Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Reference string input + quick presets */}
        <div className="lg:col-span-5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200">
              Page Reference String
            </label>
            <button
              type="button"
              onClick={generateRandomString}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Random 12 Pages</span>
            </button>
          </div>
          <input
            type="text"
            value={referenceString}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          {inputError && (
            <span className="text-[11px] text-rose-400 font-medium">{inputError}</span>
          )}

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1 mt-0.5">
            <span className="text-[10px] text-slate-400 font-mono mr-1">Presets:</span>
            {PRESET_STRINGS.map((preset) => {
              const isMatch = referenceString.trim() === preset.sequence.trim();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    isMatch
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                  title={preset.description}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 1-Click Segmented Algorithm Selector */}
        <div className="lg:col-span-4 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-200">
            Replacement Algorithm
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            {(
              [
                { id: 'FIFO', label: 'FIFO', desc: 'Earliest' },
                { id: 'LRU', label: 'LRU', desc: 'Least Used' },
                { id: 'OPTIMAL', label: 'Optimal', desc: 'Lookahead' },
              ] as const
            ).map((algo) => {
              const isSelected = algorithm === algo.id;
              return (
                <button
                  key={algo.id}
                  type="button"
                  onClick={() => onAlgorithmChange(algo.id)}
                  className={`py-2 px-1 text-center rounded-md transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className="text-xs font-bold leading-tight">{algo.label}</span>
                  <span className={`text-[9px] font-sans ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                    {algo.desc}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-slate-400">
            {algorithm === 'FIFO' && 'Replaces the page loaded earliest into memory.'}
            {algorithm === 'LRU' && 'Replaces the page with the longest idle duration.'}
            {algorithm === 'OPTIMAL' && 'Theoretical benchmark with minimal page faults.'}
          </span>
        </div>

        {/* Frame count selector with quick stepper */}
        <div className="lg:col-span-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200">
              Physical Frames
            </label>
            <span className="font-mono text-sm font-bold text-cyan-400">
              {frameCount} Slots
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onFrameCountChange(Math.max(2, frameCount - 1))}
              disabled={frameCount <= 2}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center border border-slate-700"
            >
              -
            </button>
            <input
              type="range"
              min={2}
              max={7}
              step={1}
              value={frameCount}
              onChange={(e) => onFrameCountChange(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <button
              type="button"
              onClick={() => onFrameCountChange(Math.min(7, frameCount + 1))}
              disabled={frameCount >= 7}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center border border-slate-700"
            >
              +
            </button>
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
            <span>2 Min</span>
            <span>Default: 3</span>
            <span>7 Max</span>
          </div>
        </div>
      </div>

      {/* Row 2: Visual Scrubber Slider (Instant Step Scrubbing) */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span>Simulation Timeline Scrubber:</span>
            <strong className="text-cyan-300">
              Step {currentStepIndex} of {totalSteps}
            </strong>
          </span>
          <span className="text-[11px] text-slate-400">
            {currentStepIndex === 0
              ? 'At Start'
              : currentStepIndex === totalSteps
              ? 'Complete'
              : `${Math.round((currentStepIndex / totalSteps) * 100)}% Processed`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={totalSteps}
          step={1}
          value={currentStepIndex}
          onChange={(e) => onScrubStep && onScrubStep(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          title="Drag to jump to any simulation step"
        />
      </div>

      {/* Row 3: Playback Controls & Speed */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Primary Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Reset */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors shadow-sm"
            title="Reset simulation to beginning (shortcut: R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Prev Step */}
          <button
            onClick={onPrevStep}
            disabled={isAtStart}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/60 transition-colors shadow-sm"
            title="Previous Step (shortcut: Left Arrow)"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          {/* Play / Pause Toggle */}
          {isPlaying ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md shadow-amber-500/20"
              title="Pause simulation (shortcut: Space)"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={isAtEnd}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md shadow-cyan-500/20"
              title="Play step-by-step automatically (shortcut: Space)"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </button>
          )}

          {/* Next Step */}
          <button
            onClick={onNextStep}
            disabled={isAtEnd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-500/40 transition-colors shadow-sm"
            title="Step forward one memory request (shortcut: Right Arrow)"
          >
            <span>Next</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Run All */}
          <button
            onClick={onRunAll}
            disabled={isAtEnd}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/60 transition-colors shadow-sm"
            title="Run entire simulation immediately"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Run All</span>
          </button>
        </div>

        {/* Speed Slider & Keyboard Shortcut Cue */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Keyboard className="w-3 h-3 text-slate-400" />
            <span>Shortcuts:</span>
            <kbd className="bg-slate-800 px-1 rounded text-slate-300">Space</kbd>
            <kbd className="bg-slate-800 px-1 rounded text-slate-300">←</kbd>
            <kbd className="bg-slate-800 px-1 rounded text-slate-300">→</kbd>
            <kbd className="bg-slate-800 px-1 rounded text-slate-300">R</kbd>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Speed:</span>
            </div>
            <input
              type="range"
              min={200}
              max={2000}
              step={100}
              value={2200 - simulationSpeed}
              onChange={(e) => onSpeedChange(2200 - parseInt(e.target.value, 10))}
              className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title="Simulation speed"
            />
            <span className="font-mono text-xs text-slate-300 w-10 text-right">
              {(simulationSpeed / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

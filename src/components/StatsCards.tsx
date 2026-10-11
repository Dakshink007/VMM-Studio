import { Layers, CheckCircle2, AlertOctagon, TrendingUp, Cpu, Activity } from 'lucide-react';
import { AlgorithmType } from '../types/vmm';

interface StatsCardsProps {
  totalFrames: number;
  hits: number;
  faults: number;
  hitRatio: number;
  faultRatio: number;
  algorithm: AlgorithmType;
  currentStep: number;
  totalSteps: number;
}

export function StatsCards({
  totalFrames,
  hits,
  faults,
  hitRatio,
  faultRatio,
  algorithm,
  currentStep,
  totalSteps,
}: StatsCardsProps) {
  const processedCount = hits + faults;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Frames */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Memory Frames</span>
          <Layers className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-white">{totalFrames}</span>
          <span className="text-xs text-slate-400">physical slots</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          RAM allocation
        </div>
      </div>

      {/* 2. Page Hits */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Page Hits</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">{hits}</span>
          <span className="text-xs text-slate-400">found in RAM</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Zero disk latency
        </div>
      </div>

      {/* 3. Page Faults */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Page Faults</span>
          <AlertOctagon className="w-4 h-4 text-rose-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-rose-400">{faults}</span>
          <span className="text-xs text-slate-400">traps to disk</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          I/O service required
        </div>
      </div>

      {/* 4. Hit Ratio */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Hit Ratio</span>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-white">
            {processedCount > 0 ? hitRatio.toFixed(1) : '0.0'}%
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, hitRatio))}%` }}
          />
        </div>
      </div>

      {/* 5. Fault Ratio */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Fault Ratio</span>
          <Activity className="w-4 h-4 text-rose-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-white">
            {processedCount > 0 ? faultRatio.toFixed(1) : '0.0'}%
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
          <div
            className="bg-rose-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, faultRatio))}%` }}
          />
        </div>
      </div>

      {/* 6. Current Algorithm */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Current Policy</span>
          <Cpu className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-cyan-300 tracking-tight">{algorithm}</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-mono">
          Step {currentStep} / {totalSteps}
        </div>
      </div>
    </div>
  );
}

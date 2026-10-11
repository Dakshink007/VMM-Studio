import { useState, useMemo } from 'react';
import { SimulationStep } from '../types/vmm';
import {
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface EventLogProps {
  steps: SimulationStep[];
  currentStepIndex: number;
  onJumpToStep: (stepIdx: number) => void;
}

export function EventLog({
  steps,
  currentStepIndex,
  onJumpToStep,
}: EventLogProps) {
  const [filterType, setFilterType] = useState<'all' | 'hit' | 'fault' | 'replacement'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Processed steps up to current step (or all processed so far)
  const processedSteps = useMemo(() => {
    return steps.slice(0, currentStepIndex);
  }, [steps, currentStepIndex]);

  // Filtered steps
  const filteredSteps = useMemo(() => {
    return processedSteps.filter((step) => {
      // Type filter
      if (filterType === 'hit' && !step.isHit) return false;
      if (filterType === 'fault' && step.isHit) return false;
      if (filterType === 'replacement' && (step.isHit || step.evictedPage === null)) return false;

      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const pageMatch = step.page.toString().includes(query);
        const msgMatch = step.message.toLowerCase().includes(query);
        const detailMatch = step.detail.toLowerCase().includes(query);
        return pageMatch || msgMatch || detailMatch;
      }

      return true;
    });
  }, [processedSteps, filterType, searchQuery]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col gap-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Simulation Event Log & Audit Trail
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            ({filteredSteps.length} / {processedSteps.length} events)
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'hit', label: 'Hits' },
              { id: 'fault', label: 'Faults' },
              { id: 'replacement', label: 'Evictions' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === btn.id
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by page number or message keyword..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
        />
      </div>

      {/* Log entries container */}
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {filteredSteps.length > 0 ? (
          filteredSteps.map((step) => {
            const isHit = step.isHit;
            const isEviction = step.evictedPage !== null;
            const stepNum = step.stepIndex + 1;
            const isCurrent = stepNum === currentStepIndex;

            return (
              <div
                key={step.stepIndex}
                className={`p-3 rounded-lg border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                    : isHit
                    ? 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-800/60'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-rose-800/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="pt-0.5">
                    {isHit ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isEviction ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-300">
                        Step #{stepNum}:
                      </span>
                      <span className="font-semibold text-white">
                        {step.message}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className="text-[10px] font-mono text-slate-400">
                    Hits: {step.cumulativeHits} | Faults: {step.cumulativeFaults}
                  </span>
                  <button
                    onClick={() => onJumpToStep(stepNum)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
                    title={`Inspect memory state at Step ${stepNum}`}
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">
            {processedSteps.length === 0
              ? 'No simulation events generated yet. Advance the simulation to record events.'
              : 'No log events match your current filter criteria.'}
          </div>
        )}
      </div>
    </div>
  );
}

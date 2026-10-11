import { useState } from 'react';
import { FrameState, SimulationStep, AlgorithmType } from '../types/vmm';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  History,
  Eye,
  EyeOff,
  Sparkles,
  Cpu,
  Layers,
} from 'lucide-react';

interface MemoryVisualizerProps {
  referenceList: number[];
  currentStepIndex: number; // 0 to referenceList.length
  currentStepData: SimulationStep | null;
  frameCount: number;
  algorithm: AlgorithmType;
  onJumpToStep: (stepIndex: number) => void;
  allSteps: SimulationStep[];
}

export function MemoryVisualizer({
  referenceList,
  currentStepIndex,
  currentStepData,
  frameCount,
  algorithm,
  onJumpToStep,
  allSteps,
}: MemoryVisualizerProps) {
  const [showInternals, setShowInternals] = useState<boolean>(true);

  // If simulation hasn't started yet, create empty frames
  const displayFrames: FrameState[] =
    currentStepData?.frames ||
    Array.from({ length: frameCount }, (_, i) => ({
      frameIndex: i,
      pageNumber: null,
      loadedAtStep: null,
      lastAccessedStep: null,
      status: 'empty',
    }));

  const occupiedCount = displayFrames.filter((f) => f.pageNumber !== null).length;
  const currentRequestedPage =
    currentStepIndex > 0 && currentStepIndex <= referenceList.length
      ? referenceList[currentStepIndex - 1]
      : null;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* 1. Reference String Timeline Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Reference String Timeline
            </h3>
            <span className="text-slate-400 text-xs">
              (Click any token to jump)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/80 inline-block" /> Hit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500/80 inline-block" /> Fault
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded border border-cyan-400 inline-block" /> Current
            </span>
          </div>
        </div>

        {/* Horizontal scrollable token strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 px-1">
          {referenceList.map((pageNum, idx) => {
            const stepNum = idx + 1;
            const isProcessed = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex - 1 && currentStepIndex > 0;
            const isUpcoming = idx >= currentStepIndex;

            // Historical step result
            const stepRecord = allSteps[idx];
            const isHit = stepRecord?.isHit ?? false;

            let badgeClasses = 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700';
            if (isProcessed) {
              if (isHit) {
                badgeClasses = isCurrent
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400 ring-2 ring-emerald-400/40 font-bold shadow-md shadow-emerald-950'
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/80 hover:bg-emerald-900/50';
              } else {
                badgeClasses = isCurrent
                  ? 'bg-rose-950/80 text-rose-300 border-rose-400 ring-2 ring-rose-400/40 font-bold shadow-md shadow-rose-950'
                  : 'bg-rose-950/40 text-rose-400 border-rose-800/80 hover:bg-rose-900/50';
              }
            } else if (isCurrent) {
              badgeClasses = 'bg-cyan-950/90 text-cyan-300 border-cyan-400 ring-2 ring-cyan-400/50 font-bold';
            }

            return (
              <button
                key={idx}
                onClick={() => onJumpToStep(stepNum)}
                className={`flex flex-col items-center justify-center min-w-10 sm:min-w-11 h-14 rounded-lg border text-xs font-mono transition-all duration-150 shrink-0 ${badgeClasses}`}
                title={`Step ${stepNum}: Page ${pageNum} ${isProcessed ? (isHit ? '(Hit)' : '(Fault)') : '(Upcoming)'}`}
              >
                <span className="text-[9px] text-slate-400 font-sans -mb-0.5">#{stepNum}</span>
                <span className="text-base font-bold">{pageNum}</span>
                <span className="text-[9px] font-sans">
                  {isProcessed ? (isHit ? 'HIT' : 'FAULT') : isUpcoming ? 'NEXT' : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Step Verdict & OS Hardware Pipeline Diagram */}
      {currentStepData ? (
        <div
          className={`rounded-xl border p-4 transition-all duration-200 flex flex-col gap-3 ${
            currentStepData.isHit
              ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200 shadow-md'
              : 'bg-rose-950/20 border-rose-800/80 text-rose-200 shadow-md'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {currentStepData.isHit ? (
                <div className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-md bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              <span className="text-sm font-bold text-white tracking-tight">
                {currentStepData.message}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 shrink-0">
              Reference #{currentStepIndex} of {referenceList.length}
            </div>
          </div>

          {/* Educational Visual Flow Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex flex-col">
              <span className="text-[10px] text-slate-400 font-sans">1. CPU Request</span>
              <span className="font-bold text-cyan-300">Page #{currentStepData.page}</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex flex-col">
              <span className="text-[10px] text-slate-400 font-sans">2. RAM Lookup</span>
              <span className="font-bold text-slate-200">
                {currentStepData.isHit ? 'Present in Frame ' + currentStepData.targetFrame : 'Not Resident (Valid = 0)'}
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex flex-col">
              <span className="text-[10px] text-slate-400 font-sans">3. Hardware Event</span>
              <span className={`font-bold ${currentStepData.isHit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentStepData.isHit ? 'PAGE HIT' : 'PAGE FAULT TRAP'}
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex flex-col">
              <span className="text-[10px] text-slate-400 font-sans">4. Action Taken</span>
              <span className="font-bold text-slate-200">
                {currentStepData.isHit
                  ? 'Access RAM directly'
                  : currentStepData.evictedPage !== null
                  ? `Evict P${currentStepData.evictedPage} → Frame ${currentStepData.targetFrame}`
                  : `Allocated Free Frame ${currentStepData.targetFrame}`}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {currentStepData.detail}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
          <p className="text-xs text-slate-400">
            Simulation initialized. Press <strong className="text-cyan-400">Next Step</strong> or <strong className="text-cyan-400">Play</strong> to process the first memory reference.
          </p>
        </div>
      )}

      {/* 3. Physical Memory Frames Visualization */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Physical Memory Architecture (RAM Frames)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>
              Occupancy: <strong className="text-white">{occupiedCount}</strong> / {frameCount} frames
            </span>
            <span>·</span>
            <span>{frameCount * 4} KB RAM (@ 4KB/page)</span>
          </div>
        </div>

        {/* Frames Grid */}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`,
          }}
        >
          {displayFrames.map((frame) => {
            const isEmpty = frame.pageNumber === null;
            const isHit = frame.status === 'hit';
            const isNewLoad = frame.status === 'fault-new';
            const isReplaced = frame.status === 'fault-replace';
            const evictedPage = currentStepData?.evictedPage;

            let cardBorder = 'border-slate-800 bg-slate-950/70';
            let statusBadge = (
              <span className="text-slate-400 text-[10px]">Resident</span>
            );

            if (isEmpty) {
              cardBorder = 'border-dashed border-slate-800/80 bg-slate-950/40';
              statusBadge = (
                <span className="text-slate-400 text-[10px]">Free Slot</span>
              );
            } else if (isHit) {
              cardBorder = 'border-emerald-500/80 bg-emerald-950/20 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30';
              statusBadge = (
                <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Page Hit
                </span>
              );
            } else if (isNewLoad) {
              cardBorder = 'border-cyan-500/80 bg-cyan-950/20 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30';
              statusBadge = (
                <span className="text-cyan-400 font-bold text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Loaded Free
                </span>
              );
            } else if (isReplaced) {
              cardBorder = 'border-rose-500/80 bg-rose-950/20 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30';
              statusBadge = (
                <span className="text-rose-400 font-bold text-[10px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Evicted #{evictedPage}
                </span>
              );
            }

            return (
              <div
                key={frame.frameIndex}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${cardBorder}`}
              >
                {/* Header: Frame Number & Status */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-3">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Frame {frame.frameIndex}
                  </span>
                  <div>{statusBadge}</div>
                </div>

                {/* Central Page Representation */}
                <div className="py-2 flex flex-col items-center justify-center">
                  {isEmpty ? (
                    <div className="text-slate-400 text-xs font-mono py-3">
                      [ Empty ]
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                        Resident Page
                      </span>
                      <div className="text-3xl font-extrabold font-mono text-white mt-0.5 tracking-tight">
                        {frame.pageNumber}
                      </div>
                      {isReplaced && evictedPage !== null && (
                        <div className="text-[10px] text-rose-400/90 font-mono mt-1 flex items-center gap-1">
                          <span>Replaced #{evictedPage}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span>#{frame.pageNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer metadata */}
                <div className="pt-2 border-t border-slate-800/60 mt-3 text-[10px] text-slate-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Loaded at:</span>
                    <span className="text-slate-300">
                      {frame.loadedAtStep !== null ? `Step ${frame.loadedAtStep + 1}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last access:</span>
                    <span className="text-slate-300">
                      {frame.lastAccessedStep !== null ? `Step ${frame.lastAccessedStep + 1}` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Algorithm Decision Inspector (Deep Educational Insight) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Algorithm Eviction Logic ({algorithm})
            </h3>
          </div>
          <button
            onClick={() => setShowInternals(!showInternals)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showInternals ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showInternals ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>

        {showInternals && (
          <div>
            {algorithm === 'LRU' && (
              <div className="text-xs text-slate-300 space-y-2">
                <p className="text-slate-400">
                  LRU tracks recency timestamps. If replacement is needed, the resident page with the oldest access is evicted:
                </p>
                {currentStepData?.lruAges && currentStepData.lruAges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {currentStepData.lruAges.map((entry, idx) => (
                      <div
                        key={entry.page}
                        className={`p-2.5 rounded-lg border font-mono ${
                          idx === 0
                            ? 'border-rose-500/60 bg-rose-950/20 text-rose-300'
                            : 'border-slate-800 bg-slate-950/60 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between text-[11px]">
                          <span>Page {entry.page}</span>
                          <span className="text-[10px] text-slate-400">
                            {idx === 0 ? 'LRU Victim' : `#${idx + 1} Recency`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Last used: Step {entry.lastAccessed + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">
                    Step through the simulation to inspect real-time LRU timestamps.
                  </p>
                )}
              </div>
            )}

            {algorithm === 'OPTIMAL' && (
              <div className="text-xs text-slate-300 space-y-2">
                <p className="text-slate-400">
                  Optimal looks ahead into upcoming requests. The resident page whose next appearance is farthest in time is selected:
                </p>
                {currentStepData?.optimalNextUse && currentStepData.optimalNextUse.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {currentStepData.optimalNextUse.map((entry) => (
                      <div
                        key={entry.page}
                        className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 font-mono text-slate-300"
                      >
                        <div className="text-[11px] font-bold text-cyan-300">
                          Page {entry.page}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Next reference: <strong className="text-white">{entry.distance}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">
                    Lookahead predictions appear when page replacement is required.
                  </p>
                )}
              </div>
            )}

            {algorithm === 'FIFO' && (
              <div className="text-xs text-slate-300 space-y-2">
                <p className="text-slate-400">
                  FIFO uses an arrival queue. The page that entered memory earliest is evicted next:
                </p>
                {currentStepData?.fifoQueue && currentStepData.fifoQueue.length > 0 ? (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1">
                    <span className="text-[11px] text-slate-400">Oldest (Next Eviction):</span>
                    {currentStepData.fifoQueue.map((fIdx, qIdx) => {
                      const frame = currentStepData.frames[fIdx];
                      return (
                        <div
                          key={qIdx}
                          className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 ${
                            qIdx === 0
                              ? 'border-amber-500/60 bg-amber-950/30 text-amber-300 font-bold'
                              : 'border-slate-800 bg-slate-950/60 text-slate-300'
                          }`}
                        >
                          <span>Frame {fIdx}</span>
                          <span className="text-slate-400">({frame?.pageNumber !== null ? `P${frame?.pageNumber}` : 'empty'})</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">
                    Step through the simulation to view FIFO queue rotation.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

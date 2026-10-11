import { useState, useMemo } from 'react';
import { AlgorithmResult, AlgorithmType } from '../types/vmm';
import { runAllAlgorithms, simulateAlgorithm } from '../lib/algorithms';
import {
  BarChart3,
  Award,
  TrendingDown,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface AlgorithmComparisonProps {
  referenceList: number[];
  frameCount: number;
  onApplyPreset?: (sequence: string, frames: number, algo: AlgorithmType) => void;
}

export function AlgorithmComparison({
  referenceList,
  frameCount,
}: AlgorithmComparisonProps) {
  // Run all 3 algorithms on the exact current inputs
  const results = useMemo(() => {
    return runAllAlgorithms(referenceList, frameCount);
  }, [referenceList, frameCount]);

  const { fifo, lru, optimal } = results;

  // Determine best algorithm (fewest faults)
  const minFaults = Math.min(fifo.totalFaults, lru.totalFaults, optimal.totalFaults);
  const bestAlgorithms: string[] = [];
  if (optimal.totalFaults === minFaults) bestAlgorithms.push('Optimal');
  if (lru.totalFaults === minFaults && !bestAlgorithms.includes('LRU')) bestAlgorithms.push('LRU');
  if (fifo.totalFaults === minFaults && !bestAlgorithms.includes('FIFO')) bestAlgorithms.push('FIFO');

  // Automated rationale generation
  const rationaleText = useMemo(() => {
    const parts: string[] = [];

    parts.push(
      `For this reference string of ${referenceList.length} pages across ${frameCount} physical frames: Optimal achieved ${optimal.totalFaults} faults, LRU achieved ${lru.totalFaults} faults, and FIFO generated ${fifo.totalFaults} faults.`
    );

    if (optimal.totalFaults < lru.totalFaults && lru.totalFaults < fifo.totalFaults) {
      parts.push(
        'Optimal outperformed both by utilizing future knowledge to retain pages that will be accessed soonest. LRU outperformed FIFO because the reference string displays temporal locality, which LRU capitalizes on by preserving recently accessed pages.'
      );
    } else if (lru.totalFaults === fifo.totalFaults && optimal.totalFaults < lru.totalFaults) {
      parts.push(
        'LRU and FIFO generated equal page faults because the access pattern did not provide enough temporal reuse variation before replacement occurred.'
      );
    } else if (fifo.totalFaults < lru.totalFaults) {
      parts.push(
        'FIFO unexpectedly edged out LRU on this specific sequence because recently accessed pages were not reused as soon as older pages, a rare case where pure arrival ordering aligned better with future demand.'
      );
    } else {
      parts.push(
        'Optimal defines the theoretical mathematical minimum boundary (Bélády minimum). Any online OS algorithm like LRU approximates this benchmark based on past historical access patterns.'
      );
    }

    return parts.join(' ');
  }, [results, referenceList.length, frameCount, fifo, lru, optimal]);

  // Bélády's anomaly demonstration state
  const [anomalyTested, setAnomalyTested] = useState(false);
  const anomalySeq = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
  const anomaly3 = useMemo(() => simulateAlgorithm(anomalySeq, 3, 'FIFO'), []);
  const anomaly4 = useMemo(() => simulateAlgorithm(anomalySeq, 4, 'FIFO'), []);

  // Chart data calculations
  const chartItems = [
    { label: 'FIFO', faults: fifo.totalFaults, hits: fifo.totalHits, hitRatio: fifo.hitRatio, color: 'text-amber-400', barBg: 'bg-amber-500' },
    { label: 'LRU', faults: lru.totalFaults, hits: lru.totalHits, hitRatio: lru.hitRatio, color: 'text-cyan-400', barBg: 'bg-cyan-500' },
    { label: 'Optimal', faults: optimal.totalFaults, hits: optimal.totalHits, hitRatio: optimal.hitRatio, color: 'text-violet-400', barBg: 'bg-violet-500' },
  ];

  const maxFaultsOrHits = Math.max(
    ...chartItems.map((c) => Math.max(c.faults, c.hits)),
    1
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Summary Verdict */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Tri-Algorithm Performance Comparison
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic evaluation of FIFO, LRU, and Optimal on the exact same sequence and frame count.
            </p>
          </div>

          {/* Winner Callout */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/80 text-cyan-300 text-xs">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>
              Best Performer: <strong className="font-bold text-white">{bestAlgorithms.join(' & ')}</strong> ({minFaults} Faults)
            </span>
          </div>
        </div>

        {/* 2. Side-by-Side KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* FIFO Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase">
                  FIFO (First-In, First-Out)
                </span>
                {bestAlgorithms.includes('FIFO') && (
                  <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                    Optimal Match
                  </span>
                )}
              </div>
              <div className="text-3xl font-extrabold font-mono text-white">
                {fifo.totalFaults}{' '}
                <span className="text-xs font-sans font-normal text-slate-400">faults</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Hit Ratio: <span className="text-slate-200 font-bold">{fifo.hitRatio}%</span> · Fault Ratio:{' '}
                <span className="text-slate-200 font-bold">{fifo.faultRatio}%</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Page Hits:</span>
                <span className="font-mono text-emerald-400 font-bold">{fifo.totalHits}</span>
              </div>
              <div className="flex justify-between">
                <span>Eviction Replacements:</span>
                <span className="font-mono text-slate-300">{fifo.replacements}</span>
              </div>
            </div>
          </div>

          {/* LRU Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-cyan-400 uppercase">
                  LRU (Least Recently Used)
                </span>
                {bestAlgorithms.includes('LRU') && (
                  <span className="text-[10px] text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40">
                    Best Online
                  </span>
                )}
              </div>
              <div className="text-3xl font-extrabold font-mono text-white">
                {lru.totalFaults}{' '}
                <span className="text-xs font-sans font-normal text-slate-400">faults</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Hit Ratio: <span className="text-slate-200 font-bold">{lru.hitRatio}%</span> · Fault Ratio:{' '}
                <span className="text-slate-200 font-bold">{lru.faultRatio}%</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Page Hits:</span>
                <span className="font-mono text-emerald-400 font-bold">{lru.totalHits}</span>
              </div>
              <div className="flex justify-between">
                <span>Eviction Replacements:</span>
                <span className="font-mono text-slate-300">{lru.replacements}</span>
              </div>
            </div>
          </div>

          {/* Optimal Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-violet-400 uppercase">
                  Optimal (Bélády Clairvoyant)
                </span>
                <span className="text-[10px] text-violet-300 font-bold px-1.5 py-0.5 rounded bg-violet-500/20 border border-violet-500/40">
                  Theoretical Benchmark
                </span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-white">
                {optimal.totalFaults}{' '}
                <span className="text-xs font-sans font-normal text-slate-400">faults</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Hit Ratio: <span className="text-slate-200 font-bold">{optimal.hitRatio}%</span> · Fault Ratio:{' '}
                <span className="text-slate-200 font-bold">{optimal.faultRatio}%</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Page Hits:</span>
                <span className="font-mono text-emerald-400 font-bold">{optimal.totalHits}</span>
              </div>
              <div className="flex justify-between">
                <span>Eviction Replacements:</span>
                <span className="font-mono text-slate-300">{optimal.replacements}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Visual Bar Chart */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Faults vs Hits Comparative Chart
          </h4>

          <div className="space-y-4">
            {chartItems.map((item) => {
              const faultPct = (item.faults / maxFaultsOrHits) * 100;
              const hitPct = (item.hits / maxFaultsOrHits) * 100;

              return (
                <div key={item.label} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className={`font-bold font-mono ${item.color}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      <strong className="text-rose-400">{item.faults} Faults</strong> ·{' '}
                      <strong className="text-emerald-400">{item.hits} Hits</strong> ({item.hitRatio}% Hit Rate)
                    </span>
                  </div>

                  {/* Dual Bar Display */}
                  <div className="space-y-1.5">
                    {/* Faults Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-12 font-mono">Faults</span>
                      <div className="flex-1 bg-slate-900 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, faultPct)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-rose-400 w-8 text-right">
                        {item.faults}
                      </span>
                    </div>

                    {/* Hits Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-12 font-mono">Hits</span>
                      <div className="flex-1 bg-slate-900 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, hitPct)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-400 w-8 text-right">
                        {item.hits}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Automated Analytical Explanation */}
        <div className="mt-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1.5">
            <Info className="w-4 h-4" />
            <span>Automated Algorithmic Analysis</span>
          </div>
          <p>{rationaleText}</p>
        </div>
      </div>

      {/* 5. Bélády's Anomaly Interactive Verification Lab */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Bélády’s Anomaly Interactive Proof Lab
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Normally, allocating more RAM reduces page faults. But with FIFO, more frames can paradoxically INCREASE page faults!
            </p>
          </div>

          <button
            onClick={() => setAnomalyTested(!anomalyTested)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors shrink-0"
          >
            {anomalyTested ? 'Hide Proof' : 'Verify Anomaly Live'}
          </button>
        </div>

        {anomalyTested && (
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
              <div className="text-[11px] text-slate-400 font-sans mb-1 font-bold">
                Test Reference String:
              </div>
              <div className="text-cyan-300 font-bold">
                {anomalySeq.join(', ')}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <span className="text-xs font-mono text-slate-400 block mb-1">
                  FIFO with 3 Frames:
                </span>
                <div className="text-2xl font-bold font-mono text-white">
                  {anomaly3.totalFaults} Page Faults
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Hit Ratio: {anomaly3.hitRatio}% · Fault Ratio: {anomaly3.faultRatio}%
                </div>
              </div>

              <div className="bg-slate-950 border border-rose-900/60 rounded-lg p-4">
                <span className="text-xs font-mono text-rose-300 block mb-1">
                  FIFO with 4 Frames (Paradox!):
                </span>
                <div className="text-2xl font-bold font-mono text-rose-400">
                  {anomaly4.totalFaults} Page Faults (+1 Fault)
                </div>
                <div className="text-xs text-rose-300/80 mt-1">
                  Fault Ratio increased to {anomaly4.faultRatio}% despite 33% more physical memory!
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-amber-950/20 border border-amber-900/60 rounded-lg p-3">
              <strong className="text-amber-300">Why does this occur?</strong> LRU and Optimal belong to a mathematical class known as <em>Stack Algorithms</em>, where the set of pages resident with $n$ frames is always a strict subset of pages resident with $n+1$ frames. FIFO does not satisfy this stack inclusion property, causing older pages that are immediately needed to be prematurely evicted.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

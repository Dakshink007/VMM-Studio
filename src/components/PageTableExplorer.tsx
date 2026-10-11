import { useState, useMemo } from 'react';
import { FrameState, PageTableEntry, AddressTranslationResult } from '../types/vmm';
import {
  Table,
  Calculator,
  Binary,
  ArrowRight,
  AlertOctagon,
  CheckCircle2,
  Cpu,
  Info,
  HelpCircle,
} from 'lucide-react';

interface PageTableExplorerProps {
  currentFrames: FrameState[];
  currentRequestedPage: number | null;
  allUniquePages: number[];
  currentStepIndex: number;
}

export function PageTableExplorer({
  currentFrames,
  currentRequestedPage,
  allUniquePages,
  currentStepIndex,
}: PageTableExplorerProps) {
  // Address translation calculator inputs
  const [virtualAddressInput, setVirtualAddressInput] = useState<string>('4124');
  const [pageSize, setPageSize] = useState<number>(4096); // in bytes: 1024, 2048, 4096, 8192

  // Build the complete Page Table from known virtual pages (at least 0 through 7 or all unique pages)
  const pageTableEntries: PageTableEntry[] = useMemo(() => {
    // Generate pool of virtual pages: union of 0..7 and allUniquePages
    const pageSet = new Set<number>([0, 1, 2, 3, 4, 5, 6, 7]);
    allUniquePages.forEach((p) => pageSet.add(p));
    const sortedPages = Array.from(pageSet).sort((a, b) => a - b);

    return sortedPages.map((pageNum) => {
      // Find if resident in any frame
      const frameMatch = currentFrames.find((f) => f.pageNumber === pageNum);
      const isValid = Boolean(frameMatch);
      return {
        pageNumber: pageNum,
        frameNumber: frameMatch ? frameMatch.frameIndex : null,
        isValid,
        lastAccessedStep: frameMatch?.lastAccessedStep ?? null,
        loadedAtStep: frameMatch?.loadedAtStep ?? null,
        referencedInCurrentStep: currentRequestedPage === pageNum,
      };
    });
  }, [currentFrames, currentRequestedPage, allUniquePages]);

  // Compute translation
  const translationResult: AddressTranslationResult | null = useMemo(() => {
    const vAddr = parseInt(virtualAddressInput, 10);
    if (isNaN(vAddr) || vAddr < 0) return null;

    const pageNum = Math.floor(vAddr / pageSize);
    const offset = vAddr % pageSize;

    // Look up pageNum in the active page table
    const residentFrame = currentFrames.find((f) => f.pageNumber === pageNum);
    const isPresent = Boolean(residentFrame);
    const frameNumber = residentFrame ? residentFrame.frameIndex : null;
    const physicalAddress = isPresent && frameNumber !== null ? frameNumber * pageSize + offset : null;

    // Binary formatting
    const virtualBinary = vAddr.toString(2).padStart(16, '0');
    const physicalBinary = physicalAddress !== null ? physicalAddress.toString(2).padStart(16, '0') : null;

    return {
      virtualAddress: vAddr,
      pageSize,
      pageNumber: pageNum,
      offset,
      isPresent,
      frameNumber,
      physicalAddress,
      virtualBinary,
      physicalBinary,
      virtualHex: `0x${vAddr.toString(16).toUpperCase().padStart(4, '0')}`,
      physicalHex: physicalAddress !== null ? `0x${physicalAddress.toString(16).toUpperCase().padStart(4, '0')}` : null,
    };
  }, [virtualAddressInput, pageSize, currentFrames]);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Information & Architecture Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Operating System Page Table Explorer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live per-process page table maintained by kernel memory manager and accessed by CPU MMU.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              Active Referencing Step: <strong className="text-cyan-300">#{currentStepIndex}</strong>
            </span>
          </div>
        </div>

        {/* 2. Interactive Page Table Grid */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase bg-slate-950/60">
                <th className="py-2.5 px-3">Virtual Page #</th>
                <th className="py-2.5 px-3">Physical Frame #</th>
                <th className="py-2.5 px-3">Valid / Present Bit</th>
                <th className="py-2.5 px-3">Last Accessed</th>
                <th className="py-2.5 px-3">Memory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {pageTableEntries.map((entry) => {
                const isCurrent = entry.referencedInCurrentStep;
                return (
                  <tr
                    key={entry.pageNumber}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-500/40'
                        : entry.isValid
                        ? 'bg-slate-900/30 text-slate-200 hover:bg-slate-900/60'
                        : 'text-slate-400 hover:bg-slate-900/30'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold flex items-center gap-2">
                      <span className="text-sm">{entry.pageNumber}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          Active Target
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {entry.frameNumber !== null ? (
                        <span className="text-emerald-400 font-bold">
                          Frame {entry.frameNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">— (Not in RAM)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {entry.isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 1 (Present)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <AlertOctagon className="w-3.5 h-3.5 text-slate-400" /> 0 (On Disk)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {entry.lastAccessedStep !== null
                        ? `Step ${entry.lastAccessedStep + 1}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {entry.isValid ? (
                        <span className="text-emerald-400 text-[11px] font-sans">Resident in RAM</span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-sans">Secondary Backing Store</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Address Translation Tool */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Calculator className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            MMU Hardware Address Translation Calculator
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Virtual Logical Address (Decimal)
              </label>
              <input
                type="number"
                min={0}
                max={65535}
                value={virtualAddressInput}
                onChange={(e) => setVirtualAddressInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. 4124"
              />
              <div className="flex gap-1.5 mt-2">
                {[1024, 4096, 4124, 8250, 12345].map((presetVal) => (
                  <button
                    key={presetVal}
                    type="button"
                    onClick={() => setVirtualAddressInput(presetVal.toString())}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                  >
                    {presetVal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Configured Page Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '1 KB', bytes: 1024 },
                  { label: '2 KB', bytes: 2048 },
                  { label: '4 KB', bytes: 4096 },
                  { label: '8 KB', bytes: 8192 },
                ].map((sizeOpt) => (
                  <button
                    key={sizeOpt.bytes}
                    type="button"
                    onClick={() => setPageSize(sizeOpt.bytes)}
                    className={`py-2 text-xs font-mono font-medium rounded-lg border transition-all ${
                      pageSize === sizeOpt.bytes
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {sizeOpt.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard OS page size is 4 KB ({pageSize} bytes).
              </span>
            </div>

            {/* Formula Reference */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-300 font-mono space-y-1">
              <div className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">
                Mathematical Formulas
              </div>
              <div>Page # = ⌊Virtual Address / Page Size⌋</div>
              <div>Offset = Virtual Address mod Page Size</div>
              <div>Physical Address = (Frame # × Page Size) + Offset</div>
            </div>
          </div>

          {/* Translation Result Output Column */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {translationResult ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                {/* Step Breakdown Cards */}
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                    <span className="text-[10px] text-slate-400 block mb-1 font-sans">
                      Calculated Page Number (VPN)
                    </span>
                    <span className="text-xl font-bold text-cyan-300">
                      Page {translationResult.pageNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      ⌊{translationResult.virtualAddress} / {translationResult.pageSize}⌋
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                    <span className="text-[10px] text-slate-400 block mb-1 font-sans">
                      Calculated Page Offset (d)
                    </span>
                    <span className="text-xl font-bold text-cyan-300">
                      {translationResult.offset} bytes
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {translationResult.virtualAddress} % {translationResult.pageSize}
                    </span>
                  </div>
                </div>

                {/* Page Table Lookup State */}
                <div className="border border-slate-800 rounded-lg p-3 bg-slate-900/40">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">Page Table Entry Check:</span>
                    <span className="font-mono text-slate-300">
                      Index #{translationResult.pageNumber}
                    </span>
                  </div>

                  {translationResult.isPresent ? (
                    <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-lg p-3 text-emerald-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-sm">
                          Page Hit in Page Table (Valid = 1)
                        </span>
                      </div>
                      <p className="text-xs text-emerald-300/90 leading-relaxed font-sans">
                        Virtual Page {translationResult.pageNumber} is resident in Physical Frame {translationResult.frameNumber}.
                        The CPU MMU combines Frame {translationResult.frameNumber} with offset {translationResult.offset}.
                      </p>

                      <div className="mt-3 pt-3 border-t border-emerald-800/60 font-mono text-xs space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-300">Final Physical Address:</span>
                          <span className="text-xl font-extrabold text-emerald-300">
                            {translationResult.physicalAddress}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Hexadecimal:</span>
                          <span className="text-slate-300">{translationResult.physicalHex}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Calculation: ({translationResult.frameNumber} × {translationResult.pageSize}) + {translationResult.offset} = {translationResult.physicalAddress}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-950/40 border border-rose-800/80 rounded-lg p-3 text-rose-200">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertOctagon className="w-4 h-4 text-rose-400" />
                        <span className="font-bold text-sm">
                          PAGE FAULT TRAP OCCURRED (Valid = 0)
                        </span>
                      </div>
                      <p className="text-xs text-rose-300/90 leading-relaxed font-sans">
                        Virtual Page {translationResult.pageNumber} is currently marked absent (not in physical RAM).
                        The CPU halts execution of the active thread, saves state, and invokes the OS Page Fault Handler to read the missing page from disk swap.
                      </p>
                      <div className="mt-2 text-xs font-mono text-rose-400">
                        Physical Address cannot be resolved until page is loaded into a physical frame.
                      </div>
                    </div>
                  )}
                </div>

                {/* Binary breakdown diagram */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300">
                  <div className="text-[10px] text-slate-400 font-sans uppercase mb-1 flex items-center gap-1.5">
                    <Binary className="w-3.5 h-3.5 text-cyan-400" />
                    Bit-Level Representation
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span>Virtual Address ({translationResult.virtualAddress}):</span>
                    <span className="text-cyan-300">{translationResult.virtualBinary} ({translationResult.virtualHex})</span>
                  </div>
                  {translationResult.physicalAddress !== null && (
                    <div className="flex items-center justify-between py-1">
                      <span>Physical Address ({translationResult.physicalAddress}):</span>
                      <span className="text-emerald-300">{translationResult.physicalBinary} ({translationResult.physicalHex})</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Please enter a valid non-negative virtual address.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

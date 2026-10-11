import { FrameState } from '../types/vmm';
import { Table, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react';

interface MiniPageTableProps {
  currentFrames: FrameState[];
  currentRequestedPage: number | null;
  allUniquePages: number[];
  onOpenFullPageTable: () => void;
}

export function MiniPageTable({
  currentFrames,
  currentRequestedPage,
  allUniquePages,
  onOpenFullPageTable,
}: MiniPageTableProps) {
  const pageSet = new Set<number>([0, 1, 2, 3, 4, 5]);
  allUniquePages.forEach((p) => pageSet.add(p));
  const sortedPages = Array.from(pageSet).sort((a, b) => a - b);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-1.5">
            <Table className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Page Table
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Synced with RAM
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-950/60">
                <th className="py-1.5 px-2">Page</th>
                <th className="py-1.5 px-2">Valid</th>
                <th className="py-1.5 px-2">Frame</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedPages.slice(0, 7).map((pageNum) => {
                const residentFrame = currentFrames.find((f) => f.pageNumber === pageNum);
                const isValid = Boolean(residentFrame);
                const isTarget = currentRequestedPage === pageNum;

                return (
                  <tr
                    key={pageNum}
                    className={`transition-colors ${
                      isTarget
                        ? 'bg-cyan-950/40 text-cyan-200 font-bold'
                        : isValid
                        ? 'text-slate-200'
                        : 'text-slate-400'
                    }`}
                  >
                    <td className="py-1.5 px-2 flex items-center gap-1">
                      <span>P{pageNum}</span>
                      {isTarget && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      )}
                    </td>
                    <td className="py-1.5 px-2">
                      {isValid ? (
                        <span className="text-emerald-400 font-bold">1 (RAM)</span>
                      ) : (
                        <span className="text-slate-400">0 (Disk)</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2">
                      {isValid ? (
                        <span className="text-emerald-400 font-bold">
                          F{residentFrame!.frameIndex}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80 mt-3">
        <button
          onClick={onOpenFullPageTable}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>MMU Address Translation Tool</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

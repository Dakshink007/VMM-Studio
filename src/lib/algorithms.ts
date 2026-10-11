import { AlgorithmResult, AlgorithmType, FrameState, SimulationStep } from '../types/vmm';

export function parseReferenceString(raw: string): number[] {
  if (!raw || typeof raw !== 'string') return [];
  // Split on commas, spaces, dashes, or newlines
  const tokens = raw.trim().split(/[\s,]+/);
  const result: number[] = [];
  for (const token of tokens) {
    if (token === '') continue;
    const val = parseInt(token, 10);
    if (!isNaN(val) && val >= 0 && val <= 999) {
      result.push(val);
    }
  }
  return result;
}

export function simulateAlgorithm(
  pages: number[],
  frameCount: number,
  algorithm: AlgorithmType
): AlgorithmResult {
  const startTime = performance.now();
  const steps: SimulationStep[] = [];

  // Internal frame memory tracking: array of frame items
  interface InternalFrame {
    frameIndex: number;
    page: number | null;
    loadedAt: number | null;
    lastAccessed: number | null;
  }

  const memory: InternalFrame[] = Array.from({ length: frameCount }, (_, i) => ({
    frameIndex: i,
    page: null,
    loadedAt: null,
    lastAccessed: null,
  }));

  // FIFO tracking queue (stores frame indices in arrival order)
  const fifoArrivalOrder: number[] = [];

  let cumulativeHits = 0;
  let cumulativeFaults = 0;
  let replacements = 0;

  for (let stepIdx = 0; stepIdx < pages.length; stepIdx++) {
    const page = pages[stepIdx];
    const existingFrameIdx = memory.findIndex((f) => f.page === page);

    if (existingFrameIdx !== -1) {
      // PAGE HIT
      cumulativeHits++;
      memory[existingFrameIdx].lastAccessed = stepIdx;

      // Prepare frame state snapshots
      const frameSnapshots: FrameState[] = memory.map((f, idx) => ({
        frameIndex: f.frameIndex,
        pageNumber: f.page,
        loadedAtStep: f.loadedAt,
        lastAccessedStep: f.lastAccessed,
        status: idx === existingFrameIdx ? 'hit' : 'retained',
      }));

      // LRU recency list
      const lruAges = memory
        .filter((f) => f.page !== null)
        .map((f) => ({ page: f.page!, lastAccessed: f.lastAccessed! }))
        .sort((a, b) => a.lastAccessed - b.lastAccessed);

      steps.push({
        stepIndex: stepIdx,
        page,
        isHit: true,
        frames: frameSnapshots,
        targetFrame: existingFrameIdx,
        evictedPage: null,
        message: `Page ${page} found in Frame ${existingFrameIdx} — Page Hit`,
        detail: `The requested virtual page is already resident in physical Frame ${existingFrameIdx}. No I/O disk transfer needed.`,
        fifoQueue: [...fifoArrivalOrder],
        lruAges,
        cumulativeHits,
        cumulativeFaults,
      });
    } else {
      // PAGE FAULT
      cumulativeFaults++;

      // Check if an empty frame is available
      const emptyFrameIdx = memory.findIndex((f) => f.page === null);

      if (emptyFrameIdx !== -1) {
        // Free frame available
        memory[emptyFrameIdx].page = page;
        memory[emptyFrameIdx].loadedAt = stepIdx;
        memory[emptyFrameIdx].lastAccessed = stepIdx;
        fifoArrivalOrder.push(emptyFrameIdx);

        const frameSnapshots: FrameState[] = memory.map((f, idx) => ({
          frameIndex: f.frameIndex,
          pageNumber: f.page,
          loadedAtStep: f.loadedAt,
          lastAccessedStep: f.lastAccessed,
          status: idx === emptyFrameIdx ? 'fault-new' : f.page === null ? 'empty' : 'retained',
        }));

        steps.push({
          stepIndex: stepIdx,
          page,
          isHit: false,
          frames: frameSnapshots,
          targetFrame: emptyFrameIdx,
          evictedPage: null,
          message: `Page ${page} caused a Page Fault — Loaded into empty Frame ${emptyFrameIdx}`,
          detail: `Physical memory had an unoccupied slot (Frame ${emptyFrameIdx}). Page ${page} was loaded from virtual storage without replacing any resident page.`,
          fifoQueue: [...fifoArrivalOrder],
          cumulativeHits,
          cumulativeFaults,
        });
      } else {
        // All frames full: PAGE REPLACEMENT NEEDED
        replacements++;
        let victimFrameIdx = 0;
        let explanation = '';
        let optimalNextUse: { page: number; nextUseIndex: number | null; distance: string }[] | undefined;

        if (algorithm === 'FIFO') {
          // FIFO: Victim is the frame that entered earliest (head of fifoArrivalOrder)
          victimFrameIdx = fifoArrivalOrder.shift()!;
          fifoArrivalOrder.push(victimFrameIdx);
          const evictedPage = memory[victimFrameIdx].page!;
          explanation = `Under FIFO, Page ${evictedPage} in Frame ${victimFrameIdx} was loaded earliest (at step ${memory[victimFrameIdx].loadedAt}), so it is selected as the victim.`;
        } else if (algorithm === 'LRU') {
          // LRU: Victim is the frame with the smallest lastAccessed time
          let oldestTime = Infinity;
          for (let i = 0; i < memory.length; i++) {
            if (memory[i].lastAccessed! < oldestTime) {
              oldestTime = memory[i].lastAccessed!;
              victimFrameIdx = i;
            }
          }
          const evictedPage = memory[victimFrameIdx].page!;
          explanation = `Under LRU, Page ${evictedPage} in Frame ${victimFrameIdx} has not been referenced since step ${memory[victimFrameIdx].lastAccessed} (longest idle duration), so it is replaced.`;
        } else if (algorithm === 'OPTIMAL') {
          // OPTIMAL: Clairvoyant lookahead
          // For each page currently in memory, find the next reference in pages[stepIdx + 1 ...]
          let farthestUse = -1;
          const nextUseArray: { page: number; nextUseIndex: number | null; distance: string }[] = [];

          for (let i = 0; i < memory.length; i++) {
            const residentPage = memory[i].page!;
            let nextIndex: number | null = null;
            for (let futureIdx = stepIdx + 1; futureIdx < pages.length; futureIdx++) {
              if (pages[futureIdx] === residentPage) {
                nextIndex = futureIdx;
                break;
              }
            }

            const distStr = nextIndex === null ? 'Never' : `in ${nextIndex - stepIdx} step(s) (Step ${nextIndex})`;
            nextUseArray.push({
              page: residentPage,
              nextUseIndex: nextIndex,
              distance: distStr,
            });

            // If a page is never referenced again, distance is effectively infinite
            const effectiveDist = nextIndex === null ? Infinity : nextIndex;

            if (effectiveDist > farthestUse) {
              farthestUse = effectiveDist;
              victimFrameIdx = i;
            }
          }

          optimalNextUse = nextUseArray;
          const evictedPage = memory[victimFrameIdx].page!;
          const victimInfo = nextUseArray.find((u) => u.page === evictedPage);
          explanation = `Under Optimal, future references are scanned: Page ${evictedPage} in Frame ${victimFrameIdx} is next needed ${victimInfo?.distance ?? 'farthest in future'}, maximizing hit likelihood for other pages.`;
        }

        const evictedPage = memory[victimFrameIdx].page;
        memory[victimFrameIdx].page = page;
        memory[victimFrameIdx].loadedAt = stepIdx;
        memory[victimFrameIdx].lastAccessed = stepIdx;

        const frameSnapshots: FrameState[] = memory.map((f, idx) => ({
          frameIndex: f.frameIndex,
          pageNumber: f.page,
          loadedAtStep: f.loadedAt,
          lastAccessedStep: f.lastAccessed,
          status: idx === victimFrameIdx ? 'fault-replace' : 'retained',
          isVictim: idx === victimFrameIdx,
        }));

        // LRU recency list
        const lruAges = memory
          .filter((f) => f.page !== null)
          .map((f) => ({ page: f.page!, lastAccessed: f.lastAccessed! }))
          .sort((a, b) => a.lastAccessed - b.lastAccessed);

        steps.push({
          stepIndex: stepIdx,
          page,
          isHit: false,
          frames: frameSnapshots,
          targetFrame: victimFrameIdx,
          evictedPage,
          message: `Page ${page} caused a Page Fault — Evicted Page ${evictedPage} from Frame ${victimFrameIdx}`,
          detail: explanation,
          fifoQueue: [...fifoArrivalOrder],
          lruAges,
          optimalNextUse,
          cumulativeHits,
          cumulativeFaults,
        });
      }
    }
  }

  const totalHits = cumulativeHits;
  const totalFaults = cumulativeFaults;
  const totalRequests = pages.length;
  const hitRatio = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  const faultRatio = totalRequests > 0 ? (totalFaults / totalRequests) * 100 : 0;

  const names: Record<AlgorithmType, string> = {
    FIFO: 'First-In, First-Out (FIFO)',
    LRU: 'Least Recently Used (LRU)',
    OPTIMAL: 'Optimal Page Replacement (OPT / Bélády)',
  };

  return {
    algorithm,
    name: names[algorithm],
    totalHits,
    totalFaults,
    hitRatio: parseFloat(hitRatio.toFixed(1)),
    faultRatio: parseFloat(faultRatio.toFixed(1)),
    replacements,
    steps,
    executionTimeMs: parseFloat((performance.now() - startTime).toFixed(2)),
  };
}

export function runAllAlgorithms(pages: number[], frameCount: number): {
  fifo: AlgorithmResult;
  lru: AlgorithmResult;
  optimal: AlgorithmResult;
} {
  return {
    fifo: simulateAlgorithm(pages, frameCount, 'FIFO'),
    lru: simulateAlgorithm(pages, frameCount, 'LRU'),
    optimal: simulateAlgorithm(pages, frameCount, 'OPTIMAL'),
  };
}

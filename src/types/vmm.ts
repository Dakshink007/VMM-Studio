export type AlgorithmType = 'FIFO' | 'LRU' | 'OPTIMAL';

export interface FrameState {
  frameIndex: number;
  pageNumber: number | null; // null if empty
  loadedAtStep: number | null;
  lastAccessedStep: number | null;
  status: 'empty' | 'hit' | 'fault-new' | 'fault-replace' | 'retained';
  isVictim?: boolean;
}

export interface SimulationStep {
  stepIndex: number;
  page: number;
  isHit: boolean;
  frames: FrameState[];
  targetFrame: number;
  evictedPage: number | null;
  message: string;
  detail: string;
  // Algorithm-specific debug/explain states
  fifoQueue?: number[];
  lruAges?: { page: number; lastAccessed: number }[];
  optimalNextUse?: { page: number; nextUseIndex: number | null; distance: string }[];
  cumulativeHits: number;
  cumulativeFaults: number;
}

export interface AlgorithmResult {
  algorithm: AlgorithmType;
  name: string;
  totalHits: number;
  totalFaults: number;
  hitRatio: number;
  faultRatio: number;
  replacements: number;
  steps: SimulationStep[];
  executionTimeMs?: number;
}

export interface PageTableEntry {
  pageNumber: number;
  frameNumber: number | null;
  isValid: boolean;
  lastAccessedStep: number | null;
  loadedAtStep: number | null;
  referencedInCurrentStep: boolean;
}

export interface AddressTranslationResult {
  virtualAddress: number;
  pageSize: number;
  pageNumber: number;
  offset: number;
  isPresent: boolean;
  frameNumber: number | null;
  physicalAddress: number | null;
  virtualBinary: string;
  physicalBinary: string | null;
  virtualHex: string;
  physicalHex: string | null;
}

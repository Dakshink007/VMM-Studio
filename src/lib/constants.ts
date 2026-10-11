export interface PresetString {
  id: string;
  label: string;
  frames: number;
  sequence: string;
  description: string;
  category: 'standard' | 'academic' | 'anomaly';
}

export const PRESET_STRINGS: PresetString[] = [
  {
    id: 'textbook',
    label: 'Standard Textbook',
    frames: 3,
    sequence: '7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3',
    description: 'Classic operating systems reference string from Silberschatz, Galvin & Gagne.',
    category: 'standard',
  },
  {
    id: 'belady',
    label: "Bélády's Anomaly Test",
    frames: 3,
    sequence: '1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5',
    description: "Famous sequence where FIFO produces 9 faults with 3 frames, but 10 faults with 4 frames!",
    category: 'anomaly',
  },
  {
    id: 'locality',
    label: 'Strong Temporal Locality',
    frames: 3,
    sequence: '2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2',
    description: 'Simulates typical program loops where recently accessed pages are referenced repeatedly.',
    category: 'standard',
  },
  {
    id: 'guided',
    label: 'Guided Example (Section 10)',
    frames: 3,
    sequence: '1, 2, 3, 1, 4, 2',
    description: 'Clean introductory example for stepping through basic allocations, hits, and replacements.',
    category: 'academic',
  },
  {
    id: 'cycling',
    label: 'Thrashing & Heavy Cycling',
    frames: 4,
    sequence: '0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 0, 1',
    description: 'Workload where working set exceeds physical frames, highlighting differences in eviction.',
    category: 'academic',
  },
];

export interface LessonTopic {
  id: string;
  title: string;
  summary: string;
  content: string[];
  keyFormula?: string;
  interactiveNote?: string;
}

export const VMM_LESSONS: LessonTopic[] = [
  {
    id: 'virtual-vs-physical',
    title: 'Virtual vs Physical Memory',
    summary: 'How modern operating systems decouple logical programmer address space from hardware RAM.',
    content: [
      'Programs execute in an isolated virtual address space created by the operating system and CPU Memory Management Unit (MMU).',
      'Physical memory (RAM) is finite, expensive, and fragmented. Virtual memory allows processes to appear as though they possess a massive contiguous block of memory, even when RAM is nearly full.',
      'Inactive or background pages reside on secondary backing store (SSD or swap file) until demanded by the CPU instruction stream.',
    ],
    interactiveNote: 'Observe in the simulator how multiple virtual pages (e.g., 7, 0, 1, 2) share a small pool of 3 physical frames.',
  },
  {
    id: 'paging-frames',
    title: 'Paging & Page Frames',
    summary: 'The fundamental architectural partitioning: virtual memory is divided into Pages, physical RAM into Frames.',
    content: [
      'Paging divides virtual memory into fixed-size blocks called Pages (commonly 4 KB in modern architectures like x86-64 and ARM).',
      'Physical memory is partitioned into identical fixed-size blocks called Frames (or Page Frames).',
      'Because pages and frames have the exact same size, any virtual page can be placed into any available physical frame without external fragmentation.',
    ],
    keyFormula: 'Page Size = Frame Size = 2^n bytes (e.g., 4096 bytes = 4 KB, where offset requires 12 bits)',
  },
  {
    id: 'page-table-translation',
    title: 'Page Tables & Address Translation',
    summary: 'How the MMU maps a Virtual Address (Page # + Offset) into a Physical Address (Frame # + Offset).',
    content: [
      'A Virtual Address consists of two parts: the Virtual Page Number (VPN) and the Offset within that page.',
      'The Page Table is a per-process OS data structure indexed by Virtual Page Number.',
      'The Page Table entry contains the physical Frame Number and control bits, primarily the Valid/Present bit (1 if in RAM, 0 if on disk).',
      'If the Valid bit is 1, the MMU concatenates the Frame Number with the original Offset to generate the final Physical Address.',
    ],
    keyFormula: 'Page # = ⌊Virtual Address / Page Size⌋\nOffset = Virtual Address mod Page Size\nPhysical Address = (Frame # × Page Size) + Offset',
  },
  {
    id: 'page-fault-mechanism',
    title: 'Page Faults & OS Trap Handling',
    summary: 'What happens when a program accesses a virtual page whose Valid bit is 0.',
    content: [
      '1. Hardware Trap: The CPU MMU detects the Present/Valid bit is 0 and triggers an internal interrupt (Page Fault Trap).',
      '2. OS Context Save: The operating system saves the executing process registers and CPU state.',
      '3. Backing Store Lookup: The OS checks internal tables to locate the requested page on secondary storage (swap/disk).',
      '4. Frame Allocation: The OS searches for a free frame. If RAM is full, it executes a Page Replacement Algorithm (FIFO, LRU, etc.) to evict a resident page.',
      '5. Disk I/O: The page is read from disk into the allocated frame (high latency operation).',
      '6. Page Table Update: The OS writes the frame number into the page table entry and sets Valid = 1.',
      '7. Instruction Restart: The OS resumes the interrupted process, which now accesses the page transparently.',
    ],
  },
  {
    id: 'replacement-algorithms',
    title: 'Replacement Algorithms: FIFO vs LRU vs Optimal',
    summary: 'The mathematical strategies used by the OS to pick which page to evict when RAM is full.',
    content: [
      '• FIFO (First-In, First-Out): The simplest policy. Evicts the page that entered memory earliest, regardless of how frequently it is accessed. Suffers from Bélády’s Anomaly where allocating more frames can paradoxically increase page faults.',
      '• LRU (Least Recently Used): Exploits Temporal Locality (pages used recently are likely to be accessed again soon). Evicts the page that has not been referenced for the longest duration. Requires hardware assistance (counters or stack) to implement efficiently.',
      '• Optimal (Bélády’s Algorithm): The theoretical benchmark with minimal possible page faults. Evicts the page whose next reference occurs farthest in the future (or never). Unimplementable in real general-purpose OS because the kernel cannot predict future memory accesses, but serves as the gold standard for performance evaluation.',
    ],
  },
];

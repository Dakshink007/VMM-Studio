import { useState, useMemo } from 'react';
import { VMM_LESSONS, LessonTopic } from '../lib/constants';
import { simulateAlgorithm } from '../lib/algorithms';
import {
  BookOpen,
  HelpCircle,
  Play,
  SkipForward,
  SkipBack,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

export function LearningCenter() {
  const [activeLessonId, setActiveLessonId] = useState<string>(VMM_LESSONS[0].id);

  // Guided Walkthrough state (1, 2, 3, 1, 4, 2 with 3 frames)
  const guidedSequence = [1, 2, 3, 1, 4, 2];
  const guidedAlgo = 'LRU';
  const guidedResult = useMemo(
    () => simulateAlgorithm(guidedSequence, 3, guidedAlgo),
    []
  );

  const [guidedStepIndex, setGuidedStepIndex] = useState<number>(0); // 0 to 6

  // Guided step explanations
  const guidedStepNotes = [
    {
      title: 'Initial State: Clean Memory',
      page: null,
      desc: 'All 3 physical frames in RAM are empty. The page table has all valid bits set to 0. No processes have referenced pages yet.',
    },
    {
      title: 'Step 1: Reference Page 1 (Page Fault)',
      page: 1,
      desc: 'CPU requests Page 1. Page 1 is not resident in RAM, causing a Page Fault. Since Frame 0 is empty, Page 1 is loaded directly into Frame 0 without replacing anything.',
    },
    {
      title: 'Step 2: Reference Page 2 (Page Fault)',
      page: 2,
      desc: 'CPU requests Page 2. Not resident in RAM -> Page Fault. Frame 1 is empty, so Page 2 is loaded into Frame 1.',
    },
    {
      title: 'Step 3: Reference Page 3 (Page Fault)',
      page: 3,
      desc: 'CPU requests Page 3. Not resident in RAM -> Page Fault. Frame 2 is empty, so Page 3 is loaded into Frame 2. Physical RAM is now 100% full!',
    },
    {
      title: 'Step 4: Reference Page 1 (PAGE HIT!)',
      page: 1,
      desc: 'CPU requests Page 1 again. The MMU checks Frame 0 and finds Page 1 is already present (Valid Bit = 1). PAGE HIT! No disk transfer is needed. Under LRU, Page 1’s last-access timestamp is updated to Step 4.',
    },
    {
      title: 'Step 5: Reference Page 4 (Page Fault + Eviction!)',
      page: 4,
      desc: 'CPU requests Page 4. Page 4 is absent (Page Fault). All frames are occupied, so a victim must be evicted. LRU examines recent accesses: Page 1 was accessed at Step 4, Page 3 at Step 3, and Page 2 at Step 2 (least recently used!). Page 2 in Frame 1 is evicted, and Page 4 replaces it.',
    },
    {
      title: 'Step 6: Reference Page 2 (Page Fault + Eviction!)',
      page: 2,
      desc: 'CPU requests Page 2. Page 2 was just evicted in Step 5, so this causes another Page Fault! Recency check: Page 4 (Step 5), Page 1 (Step 4), Page 3 (Step 3). Page 3 in Frame 2 is the oldest! Page 3 is evicted from Frame 2, and Page 2 is loaded.',
    },
  ];

  const currentGuidedStep = guidedStepNotes[guidedStepIndex];
  const currentStepData = guidedStepIndex > 0 ? guidedResult.steps[guidedStepIndex - 1] : null;

  const activeLesson = VMM_LESSONS.find((l) => l.id === activeLessonId) || VMM_LESSONS[0];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Interactive Operating System Learning Center
            </h2>
            <p className="text-xs text-slate-400">
              Master the core theory of virtual memory, address translation, page faults, and replacement policies.
            </p>
          </div>
        </div>

        {/* Lesson Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-1">
          {VMM_LESSONS.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => setActiveLessonId(lesson.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeLessonId === lesson.id
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {lesson.title}
            </button>
          ))}
        </div>

        {/* Active Lesson Content */}
        <div className="mt-4 bg-slate-950 border border-slate-800/80 rounded-xl p-5 text-xs text-slate-300 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              {activeLesson.title}
            </h3>
            <p className="text-slate-400 leading-relaxed">
              {activeLesson.summary}
            </p>
          </div>

          <div className="space-y-2 border-t border-slate-800/60 pt-3">
            {activeLesson.content.map((paragraph, idx) => (
              <p key={idx} className="leading-relaxed text-slate-300">
                {paragraph}
              </p>
            ))}
          </div>

          {activeLesson.keyFormula && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 font-mono text-cyan-300 text-xs">
              <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold mb-1">
                Mathematical Rule:
              </span>
              <pre className="whitespace-pre-wrap">{activeLesson.keyFormula}</pre>
            </div>
          )}

          {activeLesson.interactiveNote && (
            <div className="flex items-start gap-2 bg-cyan-950/20 border border-cyan-800/60 rounded-lg p-3 text-cyan-200">
              <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span className="text-xs">{activeLesson.interactiveNote}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Guided Walkthrough (Section 10 Requirement) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Guided Interactive Walkthrough (Reference: 1, 2, 3, 1, 4, 2)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Step-by-step educational trace demonstrating initial allocations, a page hit, and two LRU victim evictions.
            </p>
          </div>

          {/* Stepper controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuidedStepIndex(0)}
              className="p-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Reset walkthrough"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setGuidedStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={guidedStepIndex === 0}
              className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 border border-slate-700 flex items-center gap-1"
            >
              <SkipBack className="w-3 h-3" />
              <span>Back</span>
            </button>
            <span className="text-xs font-mono text-cyan-300 px-1">
              Step {guidedStepIndex} / {guidedSequence.length}
            </span>
            <button
              onClick={() => setGuidedStepIndex((prev) => Math.min(guidedSequence.length, prev + 1))}
              disabled={guidedStepIndex === guidedSequence.length}
              className="px-2.5 py-1 text-xs font-bold rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 flex items-center gap-1"
            >
              <span>Next</span>
              <SkipForward className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Guided String Tokens */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-mono">Reference Stream:</span>
          {guidedSequence.map((val, idx) => {
            const isCompleted = idx < guidedStepIndex;
            const isCurrent = idx === guidedStepIndex - 1;
            return (
              <button
                key={idx}
                onClick={() => setGuidedStepIndex(idx + 1)}
                className={`w-9 h-10 rounded-lg font-mono text-sm font-bold flex flex-col items-center justify-center border transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 ring-2 ring-cyan-500/40 shadow'
                    : isCompleted
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <span className="text-[9px] text-slate-400 font-sans font-normal">#{idx + 1}</span>
                <span>{val}</span>
              </button>
            );
          })}
        </div>

        {/* Walkthrough Explanation Box */}
        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            {currentStepData?.isHit ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : guidedStepIndex > 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <Layers className="w-4 h-4 text-slate-400" />
            )}
            <h4 className="text-sm font-bold text-white">
              {currentGuidedStep.title}
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentGuidedStep.desc}
          </p>

          {/* Memory Frames Snapshot */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800/80">
            {[0, 1, 2].map((fIdx) => {
              const frameState = currentStepData?.frames[fIdx];
              const residentPage = frameState?.pageNumber ?? null;
              const isHit = frameState?.status === 'hit';
              const isReplaced = frameState?.status === 'fault-replace';
              const isNew = frameState?.status === 'fault-new';

              let borderColor = 'border-slate-800 bg-slate-900/40';
              if (isHit) borderColor = 'border-emerald-500/80 bg-emerald-950/20 shadow-md';
              else if (isNew) borderColor = 'border-cyan-500/80 bg-cyan-950/20 shadow-md';
              else if (isReplaced) borderColor = 'border-rose-500/80 bg-rose-950/20 shadow-md';

              return (
                <div
                  key={fIdx}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center font-mono ${borderColor}`}
                >
                  <span className="text-[10px] text-slate-400">Frame {fIdx}</span>
                  <div className="text-2xl font-bold text-white my-1">
                    {residentPage !== null ? `Page ${residentPage}` : 'Empty'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {isHit ? 'Page Hit' : isReplaced ? 'Replaced' : isNew ? 'Loaded' : 'Resident'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

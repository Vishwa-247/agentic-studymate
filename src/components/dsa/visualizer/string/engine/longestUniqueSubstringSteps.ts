import type { StringStep } from "../types";

function stepId(i: number, kind: string) {
  return `longest-unique:i${i}:${kind}`;
}

export function longestUniqueSubstringSteps(input: string): StringStep[] {
  const chars = [...input];
  const steps: StringStep[] = [];
  const lastSeen = new Map<string, number>();

  let start = 0;
  let bestLen = 0;
  let best: [number, number] = [0, -1];
  let iter = 0;

  steps.push({
    id: "longest-unique:init",
    chars: [...chars],
    windowStart: start,
    windowEnd: -1,
    narration: "Start sliding window. Maintain a window with all unique characters.",
    invariant: "The current window contains no duplicates.",
  });

  for (let end = 0; end < chars.length; end++) {
    const ch = chars[end] ?? "";
    const prev = lastSeen.get(ch);

    steps.push({
      id: stepId(iter++, "checkpoint"),
      chars: [...chars],
      windowStart: start,
      windowEnd: end,
      activeIndices: [end],
      narration: `Extend window to include '${ch}' at index ${end}.`,
      invariant: "If a duplicate enters, we will move start to restore uniqueness.",
      checkpoint: {
        question: "Is the current window guaranteed to remain duplicate-free without moving start?",
        expected: prev === undefined || prev < start,
      },
    });

    if (prev !== undefined && prev >= start) {
      const newStart = prev + 1;
      steps.push({
        id: stepId(iter++, "shrink"),
        chars: [...chars],
        windowStart: start,
        windowEnd: end,
        activeIndices: [prev, end],
        narration: `Duplicate '${ch}' found (last seen at ${prev}). Move start to ${newStart}.`,
        invariant: "After moving start, the window will contain only unique characters.",
      });
      start = newStart;
    }

    lastSeen.set(ch, end);
    const len = end - start + 1;
    if (len > bestLen) {
      bestLen = len;
      best = [start, end];
      steps.push({
        id: stepId(iter++, "best"),
        chars: [...chars],
        windowStart: start,
        windowEnd: end,
        narration: `New best length: ${bestLen}.`,
        invariant: "bestLen is the largest valid window length seen so far.",
      });
    } else {
      steps.push({
        id: stepId(iter++, "ok"),
        chars: [...chars],
        windowStart: start,
        windowEnd: end,
        narration: "Window is valid; continue.",
        invariant: "The current window contains no duplicates.",
      });
    }
  }

  steps.push({
    id: "longest-unique:done",
    chars: [...chars],
    windowStart: best[0],
    windowEnd: best[1],
    narration: `Done. Best window length is ${bestLen}.`,
    invariant: "The best window recorded is optimal.",
  });

  return steps;
}

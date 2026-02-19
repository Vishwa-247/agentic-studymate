import type { StringStep } from "../types";

function stepId(i: number, kind: string) {
  return `reverse:i${i}:${kind}`;
}

export function reverseStringSteps(input: string): StringStep[] {
  const chars = [...input];
  const steps: StringStep[] = [];
  const n = chars.length;

  if (n <= 1) {
    return [
      {
        id: "reverse:trivial",
        chars: [...chars],
        left: 0,
        right: Math.max(0, n - 1),
        narration: "A single character (or empty string) is already reversed.",
        invariant: "No swaps are needed.",
      },
    ];
  }

  let l = 0;
  let r = n - 1;

  steps.push({
    id: "reverse:init",
    chars: [...chars],
    left: l,
    right: r,
    narration: "Start two-pointer reversal.",
    invariant: "Nothing is fixed yet.",
  });

  let iter = 0;
  while (l < r) {
    steps.push({
      id: stepId(iter, "checkpoint"),
      chars: [...chars],
      left: l,
      right: r,
      activeIndices: [l, r],
      narration: `We will swap indices ${l} and ${r}.`,
      invariant: "All characters outside [L, R] are already in their final reversed position.",
      checkpoint: {
        question: "Is everything outside [L, R] already in its final reversed position?",
        expected: true,
      },
    });

    const a = chars[l];
    const b = chars[r];
    chars[l] = b;
    chars[r] = a;

    steps.push({
      id: stepId(iter, "swap"),
      chars: [...chars],
      left: l,
      right: r,
      swapping: [l, r],
      activeIndices: [l, r],
      narration: `Swap '${a}' and '${b}'.`,
      invariant: "Swapping preserves the multiset of characters.",
    });

    l++;
    r--;

    steps.push({
      id: stepId(iter, "move"),
      chars: [...chars],
      left: l,
      right: r,
      narration: "Move pointers inward.",
      invariant: "All characters outside [L, R] are fixed in their final reversed position.",
    });

    iter++;
  }

  steps.push({
    id: "reverse:done",
    chars: [...chars],
    left: l,
    right: r,
    narration: "Done. The string is reversed.",
    invariant: "L >= R, so every position has been fixed.",
  });

  return steps;
}

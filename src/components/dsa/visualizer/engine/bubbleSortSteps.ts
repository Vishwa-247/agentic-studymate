import type { AlgorithmStep } from "../types";

function stepId(pass: number, i: number, kind: string) {
  return `bubble:p${pass}:i${i}:${kind}`;
}

/**
 * Generates deterministic Bubble Sort steps.
 * - Does not mutate the input array.
 * - Includes per-comparison checkpoints for "Pause & Predict".
 */
export function bubbleSortSteps(input: number[]): AlgorithmStep[] {
  const arr = [...input];
  const steps: AlgorithmStep[] = [];

  const n = arr.length;
  if (n <= 1) {
    steps.push({
      id: "bubble:trivial",
      array: [...arr],
      narration: "Array is already sorted.",
      invariant: "A single-element (or empty) array is sorted.",
      fixedFrom: 0,
    });
    return steps;
  }

  // Initial step
  steps.push({
    id: "bubble:init",
    array: [...arr],
    narration: "Start Bubble Sort.",
    invariant: "No elements are confirmed in final position yet.",
    fixedFrom: n,
  });

  for (let pass = 0; pass < n - 1; pass++) {
    const fixedFrom = n - pass;
    steps.push({
      id: stepId(pass, 0, "pass-start"),
      array: [...arr],
      narration: `Pass ${pass + 1}: bubble the largest element to index ${fixedFrom - 1}.`,
      invariant: pass === 0
        ? "After each full pass, the largest remaining element ends up at the end."
        : `After pass ${pass}, indices ${fixedFrom}..${n - 1} are in final position.`,
      fixedFrom,
    });

    for (let i = 0; i < fixedFrom - 1; i++) {
      const a = arr[i];
      const b = arr[i + 1];
      const shouldSwap = a > b;

      steps.push({
        id: stepId(pass, i, "compare"),
        array: [...arr],
        comparing: [i, i + 1],
        narration: `Compare ${a} and ${b}.`,
        invariant: `Indices ${fixedFrom}..${n - 1} are fixed; we only compare within 0..${fixedFrom - 1}.`,
        fixedFrom,
        checkpoint: {
          type: "swap",
          question: `Should we swap ${a} and ${b}?`,
          expected: shouldSwap,
        },
      });

      if (shouldSwap) {
        // Swap
        arr[i] = b;
        arr[i + 1] = a;

        steps.push({
          id: stepId(pass, i, "swap"),
          array: [...arr],
          swapping: [i, i + 1],
          narration: `Swap: ${b} moves left, ${a} moves right.`,
          invariant: "Swapping adjacent out-of-order elements preserves the multiset of values.",
          fixedFrom,
        });
      } else {
        steps.push({
          id: stepId(pass, i, "no-swap"),
          array: [...arr],
          comparing: [i, i + 1],
          narration: "No swap needed.",
          invariant: "If left <= right, leaving them in place keeps partial order intact.",
          fixedFrom,
        });
      }
    }

    steps.push({
      id: stepId(pass, 0, "pass-end"),
      array: [...arr],
      narration: `End of pass ${pass + 1}.`,
      invariant: `Index ${fixedFrom - 1} now holds the largest element among indices 0..${fixedFrom - 1}.`,
      fixedFrom: fixedFrom - 1,
    });
  }

  steps.push({
    id: "bubble:done",
    array: [...arr],
    narration: "Done. The array is sorted.",
    invariant: "All indices are now in final position.",
    fixedFrom: 0,
  });

  return steps;
}

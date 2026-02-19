import type { StringStep } from "../types";

function isAlphaNum(ch: string) {
  return /[a-z0-9]/i.test(ch);
}

function stepId(i: number, kind: string) {
  return `palindrome:i${i}:${kind}`;
}

export function validPalindromeSteps(input: string): StringStep[] {
  const rawChars = [...input];
  const steps: StringStep[] = [];
  let l = 0;
  let r = rawChars.length - 1;
  let iter = 0;

  steps.push({
    id: "palindrome:init",
    chars: [...rawChars],
    left: l,
    right: r,
    narration: "Start two pointers. We'll skip non-alphanumeric characters.",
    invariant: "All compared alphanumeric pairs have matched so far.",
  });

  while (l < r) {
    while (l < r && !isAlphaNum(rawChars[l] ?? "")) {
      steps.push({
        id: stepId(iter++, "skip-left"),
        chars: [...rawChars],
        left: l,
        right: r,
        activeIndices: [l],
        narration: `Skip left index ${l} (not alphanumeric).`,
        invariant: "Skipping non-alphanumerics does not affect palindrome checking.",
      });
      l++;
    }

    while (l < r && !isAlphaNum(rawChars[r] ?? "")) {
      steps.push({
        id: stepId(iter++, "skip-right"),
        chars: [...rawChars],
        left: l,
        right: r,
        activeIndices: [r],
        narration: `Skip right index ${r} (not alphanumeric).`,
        invariant: "Skipping non-alphanumerics does not affect palindrome checking.",
      });
      r--;
    }

    if (l >= r) break;

    const a = (rawChars[l] ?? "").toLowerCase();
    const b = (rawChars[r] ?? "").toLowerCase();
    const match = a === b;

    steps.push({
      id: stepId(iter++, "checkpoint"),
      chars: [...rawChars],
      left: l,
      right: r,
      activeIndices: [l, r],
      narration: `Compare '${a}' and '${b}'.`,
      invariant: "All previously compared pairs matched.",
      checkpoint: {
        question: "Have all compared character pairs matched so far?",
        expected: true,
      },
    });

    if (!match) {
      steps.push({
        id: stepId(iter++, "mismatch"),
        chars: [...rawChars],
        left: l,
        right: r,
        activeIndices: [l, r],
        narration: "Mismatch found — not a palindrome.",
        invariant: "A single mismatch is enough to conclude false.",
      });
      return steps;
    }

    steps.push({
      id: stepId(iter++, "move"),
      chars: [...rawChars],
      left: l + 1,
      right: r - 1,
      narration: "Characters match. Move both pointers inward.",
      invariant: "All compared pairs matched so far.",
    });

    l++;
    r--;
  }

  steps.push({
    id: "palindrome:done",
    chars: [...rawChars],
    left: l,
    right: r,
    narration: "Done. No mismatches found — it's a palindrome.",
    invariant: "If we never found a mismatch, the string is a palindrome under the rules.",
  });

  return steps;
}

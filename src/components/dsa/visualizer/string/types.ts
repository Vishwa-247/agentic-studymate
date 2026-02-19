export type StringCheckpoint = {
  /**
   * Concept-check question (True/False).
   * Example: "Is everything outside [L, R] already in final position?"
   */
  question: string;
  expected: boolean;
};

export type StringStep = {
  id: string;
  chars: string[];
  left?: number;
  right?: number;
  windowStart?: number;
  windowEnd?: number;
  activeIndices?: number[];
  swapping?: [number, number];

  narration: string;
  invariant: string;
  checkpoint?: StringCheckpoint;
};

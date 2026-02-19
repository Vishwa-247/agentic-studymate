export type CheckpointType = "swap";

export type AlgorithmCheckpoint = {
  type: CheckpointType;
  question: string;
  expected: boolean;
};

export type AlgorithmStep = {
  id: string;
  array: number[];
  comparing?: [number, number];
  swapping?: [number, number];
  fixedFrom?: number; // indices >= fixedFrom are in final position
  narration: string;
  invariant: string;
  checkpoint?: AlgorithmCheckpoint;
};

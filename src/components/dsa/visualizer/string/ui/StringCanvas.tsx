import { cn } from "@/lib/utils";

type StringCanvasProps = {
  chars: string[];
  left?: number;
  right?: number;
  windowStart?: number;
  windowEnd?: number;
  activeIndices?: number[];
  swapping?: [number, number];
};

export function StringCanvas({
  chars,
  left,
  right,
  windowStart,
  windowEnd,
  activeIndices,
  swapping,
}: StringCanvasProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-2">
        {chars.map((ch, i) => {
          const isLeft = left === i;
          const isRight = right === i;
          const isWindow =
            typeof windowStart === "number" &&
            typeof windowEnd === "number" &&
            i >= windowStart &&
            i <= windowEnd;
          const isActive = activeIndices?.includes(i) ?? false;
          const isSwapping =
            swapping ? i === swapping[0] || i === swapping[1] : false;
          const isFixed =
            typeof left === "number" &&
            typeof right === "number" &&
            (i < left || i > right);

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-md border text-lg font-semibold",
                  "bg-card text-card-foreground",
                  isWindow && "bg-muted",
                  isFixed && "bg-muted/50",
                  (isLeft || isRight) && "ring-2 ring-primary",
                  isActive && "border-primary",
                  isSwapping && "shadow-sm"
                )}
                aria-label={`Character ${ch} at index ${i}`}
              >
                {ch === " " ? "␠" : ch}
              </div>
              <div className="h-4 text-xs text-muted-foreground">
                {isLeft ? "L" : isRight ? "R" : ""}
              </div>
              <div className="text-[10px] text-muted-foreground">{i}</div>
            </div>
          );
        })}
      </div>

      {typeof windowStart === "number" && typeof windowEnd === "number" ? (
        <div className="text-center text-xs text-muted-foreground">
          Window: [{windowStart}, {windowEnd}]
        </div>
      ) : null}
    </div>
  );
}

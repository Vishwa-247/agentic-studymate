import { cn } from "@/lib/utils";

type BarsCanvasProps = {
  values: number[];
  comparing?: [number, number];
  swapping?: [number, number];
  fixedFrom?: number;
};

function isHighlighted(i: number, pair?: [number, number]) {
  return !!pair && (i === pair[0] || i === pair[1]);
}

export function BarsCanvas({ values, comparing, swapping, fixedFrom }: BarsCanvasProps) {
  const max = Math.max(1, ...values);

  return (
    <div className="w-full">
      <div className="flex items-end justify-center gap-2 h-56">
        {values.map((v, i) => {
          const heightPct = Math.max(6, Math.round((v / max) * 100));
          const isCompare = isHighlighted(i, comparing);
          const isSwap = isHighlighted(i, swapping);
          const isFixed = typeof fixedFrom === "number" ? i >= fixedFrom : false;

          return (
            <div
              key={i}
              className={cn(
                "w-7 rounded-t-sm transition-[height,background-color,transform] duration-300",
                isFixed ? "bg-muted" : "bg-primary/30",
                (isCompare || isSwap) && "bg-primary",
                isSwap && "scale-y-[1.02]",
              )}
              style={{ height: `${heightPct}%` }}
              aria-label={`Bar ${i + 1}: ${v}`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary/30" />
          <span>Unsorted</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Comparing/Swapping</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted" />
          <span>Fixed</span>
        </div>
      </div>
    </div>
  );
}

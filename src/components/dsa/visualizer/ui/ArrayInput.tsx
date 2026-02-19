import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";

export type ArrayParseResult =
  | { ok: true; value: number[] }
  | { ok: false; error: string };

function isParseError(r: ArrayParseResult): r is { ok: false; error: string } {
  return r.ok === false;
}

export function parseNumberArray(raw: string, opts?: { maxLen?: number; min?: number; max?: number }): ArrayParseResult {
  const maxLen = opts?.maxLen ?? 20;
  const min = opts?.min ?? 1;
  const max = opts?.max ?? 100;

  const normalized = raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,/g, " ");

  if (!normalized) return { ok: false, error: "Enter some numbers (e.g., 45, 72, 28)." };

  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length > maxLen) return { ok: false, error: `Max ${maxLen} numbers.` };

  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n))) return { ok: false, error: "Only numbers are allowed." };
  if (nums.some((n) => !Number.isFinite(n))) return { ok: false, error: "Invalid number detected." };
  if (nums.some((n) => n < min || n > max)) return { ok: false, error: `Keep values between ${min} and ${max}.` };

  return { ok: true, value: nums };
}

type ArrayInputProps = {
  value: string;
  onChange: (v: string) => void;
  onRun: (parsed: number[]) => void;
  onRandomize: () => void;
  maxLen?: number;
};

export function ArrayInput({ value, onChange, onRun, onRandomize, maxLen = 20 }: ArrayInputProps) {
  const [touched, setTouched] = useState(false);

  const parsed = useMemo(() => parseNumberArray(value, { maxLen, min: 1, max: 100 }), [value, maxLen]);
  const errorText = useMemo(() => (isParseError(parsed) ? parsed.error : null), [parsed]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="array-input">Input array</Label>
        <Input
          id="array-input"
          value={value}
          onChange={(e) => {
            setTouched(true);
            onChange(e.target.value);
          }}
          placeholder="45, 72, 28, 85, 55"
        />
        {touched && errorText ? (
          <p className="text-sm text-destructive">{errorText}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Up to {maxLen} numbers, range 1–100.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setTouched(true);
            if (parsed.ok) onRun(parsed.value);
          }}
        >
          Run
        </Button>
        <Button variant="secondary" onClick={onRandomize}>
          Randomize
        </Button>
      </div>
    </div>
  );
}

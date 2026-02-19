import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";

type StringInputProps = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  onRun: (v: string) => void;
  maxLen?: number;
  placeholder?: string;
  helperText?: string;
};

function validateString(raw: string, maxLen: number): { ok: true; value: string } | { ok: false; error: string } {
  const s = raw;
  if (s.length === 0) return { ok: false, error: "Please enter a string." };
  if (s.length > maxLen) return { ok: false, error: `Keep it under ${maxLen} characters for smooth playback.` };
  return { ok: true, value: s };
}

export function StringInput({
  label = "Input",
  value,
  onChange,
  onRun,
  maxLen = 60,
  placeholder = "Type a string…",
  helperText,
}: StringInputProps) {
  const [touched, setTouched] = useState(false);

  const validation = useMemo(() => validateString(value, maxLen), [value, maxLen]);
  const error = validation.ok ? null : (validation as { ok: false; error: string }).error;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          value={value}
          onChange={(e) => {
            if (!touched) setTouched(true);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{helperText ?? "Tip: spaces are shown as ␠."}</div>
          <div className="text-xs text-muted-foreground">
            {value.length}/{maxLen}
          </div>
        </div>
        {touched && error ? <div className="text-sm text-destructive">{error}</div> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            setTouched(true);
            if (!validation.ok) return;
            onRun(validation.value);
          }}
        >
          Run
        </Button>
      </div>
    </div>
  );
}

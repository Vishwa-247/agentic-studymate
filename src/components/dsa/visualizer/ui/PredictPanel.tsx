import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type PredictPanelProps = {
  question: string;
  expected: boolean;
  value: boolean | null;
  revealed: boolean;
  onChange: (v: boolean) => void;
  onReveal: () => void;
  onContinue: () => void;
};

export function PredictPanel({
  question,
  expected,
  value,
  revealed,
  onChange,
  onReveal,
  onContinue,
}: PredictPanelProps) {
  const correct = revealed && value !== null ? value === expected : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pause & Predict</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{question}</p>

        <div className="space-y-2">
          <Label>Your prediction</Label>
          <RadioGroup
            value={value === null ? "" : value ? "swap" : "no-swap"}
            onValueChange={(v) => onChange(v === "swap")}
            className="grid gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="pred-swap" value="swap" />
              <Label htmlFor="pred-swap">Swap</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="pred-no-swap" value="no-swap" />
              <Label htmlFor="pred-no-swap">No swap</Label>
            </div>
          </RadioGroup>
        </div>

        {revealed ? (
          <div className={cn("text-sm", correct ? "text-primary" : "text-destructive")}>
            {correct ? "Correct." : "Not quite."} Expected: {expected ? "Swap" : "No swap"}.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={onReveal} disabled={value === null || revealed}>
            Reveal
          </Button>
          <Button variant="secondary" onClick={onContinue} disabled={!revealed}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

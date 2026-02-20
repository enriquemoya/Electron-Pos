"use client";

import { Button } from "@/components/ui/button";

type PinKeypadProps = {
  disabled?: boolean;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  clearLabel: string;
  backspaceLabel: string;
};

const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"]
] as const;

export function PinKeypad({ disabled, onDigit, onBackspace, onClear, clearLabel, backspaceLabel }: PinKeypadProps) {
  return (
    <div className="space-y-2" aria-label="PIN keypad">
      {DIGIT_ROWS.map((row) => (
        <div key={row.join("-")} className="grid grid-cols-3 gap-2">
          {row.map((digit) => (
            <Button key={digit} type="button" variant="secondary" disabled={disabled} onClick={() => onDigit(digit)} className="h-11">
              {digit}
            </Button>
          ))}
        </div>
      ))}
      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant="outline" disabled={disabled} onClick={onClear} className="h-11">
          {clearLabel}
        </Button>
        <Button type="button" variant="secondary" disabled={disabled} onClick={() => onDigit("0")} className="h-11">
          0
        </Button>
        <Button type="button" variant="outline" disabled={disabled} onClick={onBackspace} className="h-11">
          {backspaceLabel}
        </Button>
      </div>
    </div>
  );
}

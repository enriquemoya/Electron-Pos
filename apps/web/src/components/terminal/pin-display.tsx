"use client";

type PinDisplayProps = {
  valueLength: number;
  maxLength?: number;
};

export function PinDisplay({ valueLength, maxLength = 6 }: PinDisplayProps) {
  const slots = Array.from({ length: maxLength }, (_, index) => index < valueLength);
  return (
    <div className="grid grid-cols-6 gap-2" aria-label="PIN display">
      {slots.map((filled, index) => (
        <div
          key={index}
          className={`h-10 rounded-md border text-center text-xl leading-10 ${
            filled ? "border-zinc-400 bg-zinc-800 text-zinc-100" : "border-zinc-700 bg-zinc-900/60 text-zinc-600"
          }`}
          aria-hidden="true"
        >
          {filled ? "•" : ""}
        </div>
      ))}
    </div>
  );
}

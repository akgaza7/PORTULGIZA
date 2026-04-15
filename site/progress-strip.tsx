type ProgressStripProps = {
  value: number;
  max: number;
  label: string;
};

export function ProgressStrip({ value, max, label }: ProgressStripProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-ink/70">
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-moss">
        <div
          className="h-full rounded-full bg-pine transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

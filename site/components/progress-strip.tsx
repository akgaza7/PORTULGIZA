type ProgressStripProps = {
  value: number;
  max: number;
  label: string;
  tone?: "beginner" | "intermediate" | "advanced" | "neutral" | "gold";
};

const toneClasses = {
  beginner: "from-portugalGreen to-portugalGreen/65",
  intermediate: "from-portugalBlue to-portugalBlue/60",
  advanced: "from-portugalRed to-portugalRed/60",
  neutral: "from-ocean to-sky",
  gold: "from-portugalGold to-portugalGold/65"
};

export function ProgressStrip({ value, max, label, tone = "neutral" }: ProgressStripProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-medium text-ink/65">
        <span>{label}</span>
        <span className="font-semibold text-ocean">
          {value}/{max}
        </span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full bg-moss/80 p-0.5">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${toneClasses[tone]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

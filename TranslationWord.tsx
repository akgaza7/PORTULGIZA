import { useState, useRef, useCallback } from "react";
import { useSpeech } from "@/hooks/useSpeech";

interface Props {
  english: string;
  portuguese: string;
}

export default function TranslationWord({ english, portuguese }: Props) {
  const [visible, setVisible] = useState(false);
  const { speak } = useSpeech();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show the tooltip and speak — only speaks when transitioning from hidden → visible
  const showWord = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible((prev) => {
      if (!prev) speak(portuguese);
      return true;
    });
  }, [portuguese, speak]);

  // Delayed hide (desktop mouseLeave — gives cursor a moment to re-enter)
  const hideWord = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), 150);
  }, []);

  // Tap toggle: show+speak on first tap, hide on second tap
  const toggleWord = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible((prev) => {
      if (!prev) speak(portuguese);
      return !prev;
    });
  }, [portuguese, speak]);

  return (
    <span className="relative inline-block">
      <span
        className="cursor-pointer font-semibold select-none"
        // Desktop hover — only fires for mouse pointer type, not touch
        onPointerEnter={(e) => { if (e.pointerType === "mouse") showWord(); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") hideWord(); }}
        // Mobile tap + desktop click
        onClick={toggleWord}
        role="button"
        tabIndex={0}
        aria-label={`${english} in Portuguese: ${portuguese}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setVisible((prev) => {
              if (!prev) speak(portuguese);
              return !prev;
            });
          }
        }}
      >
        {english}
      </span>

      {visible && (
        <span
          className="tooltip-fade-in absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-md text-xs font-bold whitespace-nowrap z-30 pointer-events-none"
          style={{ color: "#046A38" }}
          role="tooltip"
        >
          {portuguese}
          {/* Caret pointing down */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-px border-4 border-transparent border-t-slate-200 -z-10" />
        </span>
      )}
    </span>
  );
}

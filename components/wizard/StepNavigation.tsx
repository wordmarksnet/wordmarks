'use client';

interface StepNavigationProps {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  canGoBack: boolean;
}

export default function StepNavigation({ onBack, onNext, nextLabel = 'Continue', nextDisabled, canGoBack }: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-4">
      {canGoBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
      ) : (
        <div />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {nextLabel} →
      </button>
    </div>
  );
}

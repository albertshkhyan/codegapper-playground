import React, { useState } from 'react';
import { useGapStore } from '../../store/useGapStore';

export const ResultsPanel: React.FC = () => {
  const validateAnswers = useGapStore((state) => state.validateAnswers);
  const answerKey = useGapStore((state) => state.answerKey);
  const [showAnswers, setShowAnswers] = useState(false);
  
  const validation = validateAnswers();
  const { correctCount, totalCount, correctGaps, incorrectGaps, hint } = validation;

  const handleToggleAnswers = () => {
    setShowAnswers((prev) => !prev);
  };

  const answerEntries = Object.entries(answerKey)
    .map(([id, answer]) => ({ id: Number(id), answer }))
    .sort((a, b) => a.id - b.id);

  return (
    <div className={`border-t border-slate-700 bg-slate-900 px-6 ${showAnswers ? 'py-4' : 'py-0'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="mb-1.5">
            <span className="text-sm font-semibold text-slate-200">
              Results: {correctCount} / {totalCount} Correct
            </span>
          </div>
          <div className="flex items-center gap-4 mb-1">
            {correctGaps.length > 0 && (
              <div className="flex items-center gap-1.5 text-green-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Correct: {correctGaps.join(', ')}</span>
              </div>
            )}
            {incorrectGaps.length > 0 && (
              <div className="flex items-center gap-1.5 text-red-400 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Incorrect: {incorrectGaps.join(', ')}</span>
              </div>
            )}
          </div>
          {hint && (
            <div className="text-xs text-slate-400 mb-2">{hint}</div>
          )}
          {showAnswers && answerEntries.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="text-xs text-slate-400 mb-2">Answers:</div>
              <div className="space-y-1">
                {answerEntries.map(({ id, answer }) => (
                  <div key={id} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 font-mono">Gap {id}</span>
                    <span className="text-slate-300">→</span>
                    <code className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-sm">
                      {answer}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleToggleAnswers}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm hover:bg-slate-700 transition-colors flex items-center gap-2 h-fit"
        >
          <span>{showAnswers ? 'Hide Answers' : 'Show Answers'}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${showAnswers ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

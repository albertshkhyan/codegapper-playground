import React, { useMemo, useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Settings, ChevronUp, ChevronDown, Maximize2, X } from 'lucide-react';
import { useGapStore } from '../../store/useGapStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import '../../shared/lib/prism-theme.css';
import type { Segment } from '../../shared/lib/gapEngine/types';
import { GapSettingsPanel } from './GapSettingsPanel';
import { highlightCode, loadPrismLanguage } from '../../shared/utils/prismLoader';

const MIN_GAP_CH = 6;
const MAX_GAP_CH = 40;

export interface GappedCodePanelHandle {
  generateGaps: () => void;
}

interface GappedCodePanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const GappedCodePanel = forwardRef<GappedCodePanelHandle, GappedCodePanelProps>(({ isOpen, onToggle }, ref) => {
  const segments = useGapStore((state) => state.segments);
  const userAnswers = useGapStore((state) => state.userAnswers);
  const setUserAnswer = useGapStore((state) => state.setUserAnswer);
  const hasChecked = useGapStore((state) => state.hasChecked);
  const validateAnswers = useGapStore((state) => state.validateAnswers);
  const generateGaps = useGapStore((state) => state.generateGaps);
  const selectedLanguage = useGapStore((state) => state.selectedLanguage);
  
  const [isGapSettingsOpen, setIsGapSettingsOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [highlightedCache, setHighlightedCache] = useState<Record<string, string>>({});
  const fullscreenModalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isFullscreenOpen, fullscreenModalRef);

  useEffect(() => {
    if (!isFullscreenOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreenOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreenOpen]);

  // Load JavaScript by default on component mount
  useEffect(() => {
    loadPrismLanguage('javascript').catch(() => {
      // Ignore import errors
    });
  }, []);

  // Load Prism language when selectedLanguage changes
  useEffect(() => {
    loadPrismLanguage(selectedLanguage).catch(console.error);
  }, [selectedLanguage]);

  const handleGenerateGaps = () => {
    generateGaps();
  };

  // Expose generateGaps function via ref
  useImperativeHandle(ref, () => ({
    generateGaps: handleGenerateGaps,
  }));

  const handleApplyAndGenerate = () => {
    setIsGapSettingsOpen(false);
    generateGaps();
  };
  
  // Only get validation status if answers have been checked
  const validation = hasChecked ? validateAnswers() : {
    correctGaps: [] as number[],
    incorrectGaps: [] as number[],
  };
  const { correctGaps, incorrectGaps } = validation;

  // Process segments into lines for rendering with line numbers
  const processedLines = useMemo(() => {
    if (segments.length === 0) return [];

    // Split into lines and map segments to lines
    const lines: Segment[][] = [];
    let currentLine: Segment[] = [];

    for (const segment of segments) {
      if (segment.kind === 'text') {
        const linesInSegment = segment.value.split('\n');
        
        // Add all but last line (complete lines)
        for (let i = 0; i < linesInSegment.length - 1; i++) {
          if (linesInSegment[i]) {
            currentLine.push({ kind: 'text', value: linesInSegment[i] });
          }
          lines.push([...currentLine]);
          currentLine = [];
        }
        
        // Add remaining text (might be empty if segment ends with newline)
        if (linesInSegment[linesInSegment.length - 1]) {
          currentLine.push({ kind: 'text', value: linesInSegment[linesInSegment.length - 1] });
        }
      } else {
        // Gap segment - add to current line
        currentLine.push(segment);
      }
    }

    // Add final line if it has content
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }, [segments]);

  const toggleButton = (
    <button
      type="button"
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{ left: '50%', top: isOpen ? '100%' : '50%' }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 w-12 md:w-12 h-8 md:h-6 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 flex items-center justify-center transition-all duration-300 ease-in-out motion-reduce:duration-0 group shadow-lg touch-manipulation min-h-[44px] md:hidden ${
        isOpen ? 'rounded-t-md' : 'rounded-md'
      }`}
      aria-label={isOpen ? 'Collapse bottom panel' : 'Expand bottom panel'}
      aria-expanded={isOpen}
      tabIndex={0}
    >
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-slate-300 group-hover:text-slate-100 transition-colors" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-100 transition-colors" />
      )}
    </button>
  );

  if (segments.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0 relative bg-slate-900 rounded-lg border border-slate-700 overflow-visible">
        {toggleButton}
        {isOpen && (
          <div className="flex flex-col flex-1 min-h-0 h-full">
            <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-200">Fill in the Gaps</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateGaps}
                  className="px-3 md:px-3 py-2 md:py-1 text-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-slate-200 rounded border border-blue-700 transition-colors touch-manipulation min-h-[44px] md:min-h-0"
                >
                  Generate Gaps
                </button>
                <button
                  onClick={() => setIsGapSettingsOpen(true)}
                  className="px-3 md:px-3 py-2 md:py-1 text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 border border-slate-600 rounded transition-colors flex items-center gap-1.5 touch-manipulation min-h-[44px] md:min-h-0"
                  title="Configure gap generation"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreenOpen(true)}
                  className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 md:p-1.5 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded border border-transparent hover:bg-slate-800 hover:border-slate-600 transition-colors touch-manipulation"
                  title="Show fill-in-the-gaps in full screen"
                  aria-label="Show fill-in-the-gaps in full screen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-b-lg p-4 overflow-auto flex items-center justify-center">
              <div className="text-slate-400 text-sm">
                Write code in the left panel and click "Generate Gaps" to start.
              </div>
            </div>
            <GapSettingsPanel
              isOpen={isGapSettingsOpen}
              onClose={() => setIsGapSettingsOpen(false)}
              onApply={handleApplyAndGenerate}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 relative bg-slate-900 rounded-lg border border-slate-700 overflow-visible">
      {toggleButton}
      {isOpen && (
        <>
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-200">Fill in the Gaps</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateGaps}
            className="px-3 md:px-3 py-2 md:py-1 text-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-slate-200 rounded border border-blue-700 transition-colors touch-manipulation min-h-[44px] md:min-h-0"
          >
            Generate Gaps
          </button>
          <button
            onClick={() => setIsGapSettingsOpen(true)}
            className="px-3 md:px-3 py-2 md:py-1 text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 border border-slate-600 rounded transition-colors flex items-center gap-1.5 touch-manipulation min-h-[44px] md:min-h-0"
            title="Configure gap generation"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Gap Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreenOpen(true)}
            className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 md:p-1.5 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded border border-transparent hover:bg-slate-800 hover:border-slate-600 transition-colors touch-manipulation"
            title="Show fill-in-the-gaps in full screen"
            aria-label="Show fill-in-the-gaps in full screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-b-lg overflow-auto">
        <pre className="m-0 p-4 font-mono text-sm whitespace-pre">
          <code className="block">
            {processedLines.map((lineSegments, lineIndex) => {
              const lineNumber = lineIndex + 1;

              return (
                <React.Fragment key={lineIndex}>
                  <span className="text-slate-500 select-none mr-4">{lineNumber.toString().padStart(2, ' ')}</span>
                  {lineSegments.map((segment, segmentIndex) => {
                    if (segment.kind === 'text') {
                      // Use cached highlight or highlight synchronously
                      const cacheKey = `${selectedLanguage}-${segment.value}`;
                      const highlighted = highlightedCache[cacheKey] || segment.value;
                      
                      // Highlight asynchronously and cache
                      if (!highlightedCache[cacheKey]) {
                        highlightCode(segment.value, selectedLanguage).then((highlighted) => {
                          setHighlightedCache((prev) => ({
                            ...prev,
                            [cacheKey]: highlighted,
                          }));
                        });
                      }
                      
                      // Use segment value hash in key to force re-render when content changes
                      const textKey = `line-${lineIndex}-seg-${segmentIndex}-${segment.value.substring(0, 20).replace(/\s/g, '_')}`;
                      return (
                        <span
                          key={textKey}
                          dangerouslySetInnerHTML={{ __html: highlighted }}
                          className="inline"
                        />
                      );
                    } else {
                      const userAnswer = userAnswers[segment.id] || '';
                      const gapId = segment.id;
                      const isEmpty = !userAnswer.trim();
                      
                      // Border styling logic
                      let borderClasses = 'border-2 transition-colors duration-200';
                      
                      if (hasChecked) {
                        // After checking: show validation results
                        const isCorrect = correctGaps.includes(gapId);
                        const isIncorrect = incorrectGaps.includes(gapId);
                        
                        if (isCorrect) {
                          borderClasses += ' border-green-500 focus:border-green-400 focus:ring-2 focus:ring-green-500/30';
                        } else if (isIncorrect) {
                          borderClasses += ' border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/30';
                        } else if (isEmpty) {
                          borderClasses += ' border-yellow-500/60 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30';
                        } else {
                          borderClasses += ' border-slate-600 focus:border-slate-500 focus:ring-1 focus:ring-slate-500';
                        }
                      } else {
                        // Before checking: only show yellow for empty gaps, default for filled
                        if (isEmpty) {
                          borderClasses += ' border-yellow-500/60 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30';
                        } else {
                          borderClasses += ' border-slate-600 focus:border-slate-500 focus:ring-1 focus:ring-slate-500';
                        }
                      }
                      
                      // Width from expected answer length, at least placeholder size (ch units in font-mono)
                      const placeholderText = `gap ${gapId}`;
                      const gapCh = Math.min(
                        MAX_GAP_CH,
                        Math.max(MIN_GAP_CH, segment.answer.length, placeholderText.length)
                      );
                      const gapKey = `line-${lineIndex}-gap-${gapId}-${segment.answer}`;
                      return (
                        <input
                          key={gapKey}
                          type="text"
                          inputMode="text"
                          autoComplete="one-time-code"
                          name={`code-gap-${gapId}`}
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(gapId, e.target.value)}
                          onFocus={(e) => {
                            const el = e.target as HTMLInputElement;
                            const delayMs = 350;
                            window.setTimeout(() => {
                              el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                            }, delayMs);
                          }}
                          placeholder={placeholderText}
                          style={{ width: `max(65px, ${gapCh}ch)`, minWidth: `max(65px, ${gapCh}ch)` }}
                          className={`inline-block min-h-[44px] md:min-h-[28px] px-2 md:px-2 py-2 md:py-0.5 mx-0.5 bg-slate-900 rounded text-slate-200 font-mono text-sm md:text-sm focus:outline-none placeholder:text-slate-500 placeholder:text-xs align-baseline touch-manipulation scroll-mb-[20vh] ${borderClasses}`}
                        />
                      );
                    }
                  })}
                  {lineIndex < processedLines.length - 1 && '\n'}
                </React.Fragment>
              );
            })}
          </code>
        </pre>
      </div>
      <GapSettingsPanel
        isOpen={isGapSettingsOpen}
        onClose={() => setIsGapSettingsOpen(false)}
        onApply={handleApplyAndGenerate}
      />
    </div>
        </>
      )}

      {isFullscreenOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-950 p-2 md:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fill in the gaps full screen"
        >
          <div
            ref={fullscreenModalRef}
            className="flex flex-col flex-1 min-h-0 w-full max-w-[1400px] mx-auto bg-slate-900 rounded-lg border border-slate-700 overflow-hidden"
          >
            <div className="flex items-center justify-between flex-shrink-0 px-4 py-2 border-b border-slate-700 bg-slate-900">
              <h2 className="text-sm font-medium text-slate-200">Fill in the Gaps</h2>
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-200 rounded border border-transparent hover:bg-slate-800 hover:border-slate-600 transition-colors"
                aria-label="Close full screen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 bg-slate-800 border-t border-slate-700 overflow-auto">
              <pre className="m-0 p-4 font-mono text-sm whitespace-pre">
                <code className="block">
                  {processedLines.map((lineSegments, lineIndex) => {
                    const lineNumber = lineIndex + 1;
                    return (
                      <React.Fragment key={lineIndex}>
                        <span className="text-slate-500 select-none mr-4">{lineNumber.toString().padStart(2, ' ')}</span>
                        {lineSegments.map((segment, segmentIndex) => {
                          if (segment.kind === 'text') {
                            const cacheKey = `${selectedLanguage}-${segment.value}`;
                            const highlighted = highlightedCache[cacheKey] || segment.value;
                            if (!highlightedCache[cacheKey]) {
                              highlightCode(segment.value, selectedLanguage).then((h) => {
                                setHighlightedCache((prev) => ({ ...prev, [cacheKey]: h }));
                              });
                            }
                            const textKey = `fs-line-${lineIndex}-seg-${segmentIndex}-${segment.value.substring(0, 20).replace(/\s/g, '_')}`;
                            return (
                              <span key={textKey} dangerouslySetInnerHTML={{ __html: highlighted }} className="inline" />
                            );
                          } else {
                            const userAnswer = userAnswers[segment.id] || '';
                            const gapId = segment.id;
                            const isEmpty = !userAnswer.trim();
                            let borderClasses = 'border-2 transition-colors duration-200';
                            if (hasChecked) {
                              const isCorrect = correctGaps.includes(gapId);
                              const isIncorrect = incorrectGaps.includes(gapId);
                              if (isCorrect) borderClasses += ' border-green-500 focus:border-green-400 focus:ring-2 focus:ring-green-500/30';
                              else if (isIncorrect) borderClasses += ' border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/30';
                              else if (isEmpty) borderClasses += ' border-yellow-500/60 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30';
                              else borderClasses += ' border-slate-600 focus:border-slate-500 focus:ring-1 focus:ring-slate-500';
                            } else {
                              if (isEmpty) borderClasses += ' border-yellow-500/60 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30';
                              else borderClasses += ' border-slate-600 focus:border-slate-500 focus:ring-1 focus:ring-slate-500';
                            }
                            const gapCh = Math.min(MAX_GAP_CH, Math.max(MIN_GAP_CH, segment.answer.length, `gap ${gapId}`.length));
                            const gapKey = `fs-line-${lineIndex}-gap-${gapId}-${segment.answer}`;
                            return (
                              <input
                                key={gapKey}
                                type="text"
                                inputMode="text"
                                autoComplete="one-time-code"
                                name={`code-gap-${gapId}`}
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(gapId, e.target.value)}
                                placeholder={`gap ${gapId}`}
                                style={{ width: `max(65px, ${gapCh}ch)`, minWidth: `max(65px, ${gapCh}ch)` }}
                                className={`inline-block min-h-[44px] md:min-h-[28px] px-2 py-2 md:py-0.5 mx-0.5 bg-slate-900 rounded text-slate-200 font-mono text-sm focus:outline-none placeholder:text-slate-500 align-baseline touch-manipulation ${borderClasses}`}
                              />
                            );
                          }
                        })}
                        {lineIndex < processedLines.length - 1 && '\n'}
                      </React.Fragment>
                    );
                  })}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

GappedCodePanel.displayName = 'GappedCodePanel';

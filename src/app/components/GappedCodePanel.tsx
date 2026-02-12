import React, { useMemo, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Settings } from 'lucide-react';
import { useGapStore } from '../../store/useGapStore';
import '../../shared/lib/prism-theme.css';
import type { Segment } from '../../shared/lib/gapEngine/types';
import { GapSettingsPanel } from './GapSettingsPanel';
import { highlightCode, loadPrismLanguage } from '../../shared/utils/prismLoader';
export interface GappedCodePanelHandle {
  generateGaps: () => void;
}

export const GappedCodePanel = forwardRef<GappedCodePanelHandle>((_props, ref) => {
  const segments = useGapStore((state) => state.segments);
  const userAnswers = useGapStore((state) => state.userAnswers);
  const setUserAnswer = useGapStore((state) => state.setUserAnswer);
  const hasChecked = useGapStore((state) => state.hasChecked);
  const validateAnswers = useGapStore((state) => state.validateAnswers);
  const generateGaps = useGapStore((state) => state.generateGaps);
  const selectedLanguage = useGapStore((state) => state.selectedLanguage);
  
  const [isGapSettingsOpen, setIsGapSettingsOpen] = useState(false);
  const [highlightedCache, setHighlightedCache] = useState<Record<string, string>>({});
  
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

  if (segments.length === 0) {
    return (
      <div className="flex flex-col h-full">
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
    );
  }

  return (
    <div className="flex flex-col h-full">
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
                      
                      // Use segment answer in key to force re-render when gap position/answer changes
                      const gapKey = `line-${lineIndex}-gap-${gapId}-${segment.answer}`;
                      return (
                        <input
                          key={gapKey}
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(gapId, e.target.value)}
                          onFocus={(e) => {
                            (e.target as HTMLInputElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                          }}
                          placeholder={`gap ${gapId}`}
                          className={`inline-block min-w-[100px] md:min-w-[100px] min-h-[44px] md:min-h-[28px] px-2 md:px-2 py-2 md:py-0.5 mx-0.5 bg-slate-900 rounded text-slate-200 font-mono text-sm md:text-sm focus:outline-none placeholder:text-slate-500 align-baseline touch-manipulation ${borderClasses}`}
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
  );
});

GappedCodePanel.displayName = 'GappedCodePanel';

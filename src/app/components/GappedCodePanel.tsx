import React, { useMemo } from 'react';
import { useGapStore } from '../../store/useGapStore';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import '../../shared/lib/prism-theme.css';
import type { Segment } from '../../shared/lib/gapEngine/types';

/**
 * Highlight a code segment using Prism.js
 */
function highlightCodeSegment(code: string): string {
  try {
    return Prism.highlight(code, Prism.languages.javascript, 'javascript');
  } catch {
    // Fallback to plain text if highlighting fails
    return code;
  }
}

export const GappedCodePanel: React.FC = () => {
  const segments = useGapStore((state) => state.segments);
  const userAnswers = useGapStore((state) => state.userAnswers);
  const setUserAnswer = useGapStore((state) => state.setUserAnswer);

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
        <div className="px-4 py-2 border-b border-slate-700">
          <h2 className="text-sm font-medium text-slate-200">Fill in the Gaps</h2>
        </div>
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-b-lg p-4 overflow-auto flex items-center justify-center">
          <div className="text-slate-400 text-sm">
            Write code in the left panel and click "Generate Gaps" to start.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-slate-700">
        <h2 className="text-sm font-medium text-slate-200">Fill in the Gaps</h2>
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
                      // Render highlighted code using dangerouslySetInnerHTML
                      const highlighted = highlightCodeSegment(segment.value);
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
                      // Use segment answer in key to force re-render when gap position/answer changes
                      const gapKey = `line-${lineIndex}-gap-${segment.id}-${segment.answer}`;
                      return (
                        <input
                          key={gapKey}
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(segment.id, e.target.value)}
                          placeholder={`gap ${segment.id}`}
                          className="inline-block min-w-[100px] px-2 py-0.5 mx-0.5 bg-slate-900 border border-slate-600 rounded text-slate-200 font-mono text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 placeholder:text-slate-500 align-baseline"
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
  );
};

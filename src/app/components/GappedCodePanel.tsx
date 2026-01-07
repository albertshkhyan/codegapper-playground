import React from 'react';

interface Gap {
  id: number;
  placeholder: string;
  value: string;
}

interface GappedCodePanelProps {
  code: string;
  gaps: Gap[];
  onGapChange: (id: number, value: string) => void;
}

export const GappedCodePanel: React.FC<GappedCodePanelProps> = ({
  code,
  gaps,
  onGapChange,
}) => {
  const renderCodeWithGaps = () => {
    const lines = code.split('\n');
    return lines.map((line, lineIndex) => {
      const gapMatches = line.match(/__\d+__/g);
      
      if (!gapMatches) {
        return (
          <div key={lineIndex} className="flex items-center font-mono text-sm text-slate-200">
            <span className="text-slate-500 w-8 text-right pr-3">{lineIndex + 1}</span>
            <span className="flex-1">{line}</span>
          </div>
        );
      }

      let lastIndex = 0;
      const parts: React.ReactNode[] = [];
      
      gapMatches.forEach((match) => {
        const gapId = parseInt(match.replace(/__/g, ''), 10);
        const matchIndex = line.indexOf(match, lastIndex);
        
        if (matchIndex > lastIndex) {
          parts.push(
            <span key={`text-${matchIndex}`}>
              {line.substring(lastIndex, matchIndex)}
            </span>
          );
        }
        
        const gap = gaps.find((g) => g.id === gapId);
        parts.push(
          <input
            key={`gap-${gapId}`}
            type="text"
            value={gap?.value || ''}
            onChange={(e) => onGapChange(gapId, e.target.value)}
            placeholder={match}
            className="inline-block min-w-[100px] px-2 py-0.5 bg-slate-900 border border-slate-600 rounded text-slate-200 font-mono text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 placeholder:text-slate-500"
          />
        );
        
        lastIndex = matchIndex + match.length;
      });
      
      if (lastIndex < line.length) {
        parts.push(<span key={`text-end`}>{line.substring(lastIndex)}</span>);
      }

      return (
        <div key={lineIndex} className="flex items-center font-mono text-sm text-slate-200">
          <span className="text-slate-500 w-8 text-right pr-3">{lineIndex + 1}</span>
          <span className="flex-1">{parts}</span>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-slate-700">
        <h2 className="text-sm font-medium text-slate-200">Fill in the Gaps</h2>
      </div>
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-b-lg p-4 overflow-auto">
        <div className="space-y-1">{renderCodeWithGaps()}</div>
      </div>
    </div>
  );
};

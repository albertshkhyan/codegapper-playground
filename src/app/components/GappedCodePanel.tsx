import React, { useMemo } from 'react';
import { useGapStore } from '../../store/useGapStore';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import '../../shared/lib/prism-theme.css';

type Token =
  | { type: 'text'; value: string; highlighted?: string }
  | { type: 'gap'; id: number };

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

/**
 * Tokenize gapped code into text and gap tokens
 * Text tokens include Prism highlighting HTML
 */
function tokenizeGappedCode(code: string): Token[] {
  const tokens: Token[] = [];
  const gapPattern = /___(\d+)___/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = gapPattern.exec(code)) !== null) {
    // Add text before the gap
    if (match.index > lastIndex) {
      const textSegment = code.substring(lastIndex, match.index);
      tokens.push({
        type: 'text',
        value: textSegment,
        highlighted: highlightCodeSegment(textSegment),
      });
    }

    // Add gap token
    tokens.push({
      type: 'gap',
      id: parseInt(match[1], 10),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last gap
  if (lastIndex < code.length) {
    const textSegment = code.substring(lastIndex);
    tokens.push({
      type: 'text',
      value: textSegment,
      highlighted: highlightCodeSegment(textSegment),
    });
  }

  // If no gaps found, return entire code as text token
  if (tokens.length === 0) {
    const highlighted = highlightCodeSegment(code);
    tokens.push({ type: 'text', value: code, highlighted });
  }

  return tokens;
}

export const GappedCodePanel: React.FC = () => {
  const gappedCode = useGapStore((state) => state.gappedCode);
  const userAnswers = useGapStore((state) => state.userAnswers);
  const setUserAnswer = useGapStore((state) => state.setUserAnswer);

  // Tokenize and highlight all lines (must be before early return)
  const tokenizedLines = useMemo(() => {
    if (!gappedCode) return [];
    const lines = gappedCode.split('\n');
    return lines.map((line) => tokenizeGappedCode(line));
  }, [gappedCode]);

  if (!gappedCode) {
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
        <pre className="m-0 p-4 font-mono text-sm">
          <code className="block">
            {tokenizedLines.map((tokens, lineIndex) => {
              const lineNumber = lineIndex + 1;

              return (
                <React.Fragment key={lineIndex}>
                  <span className="text-slate-500 select-none mr-4">{lineNumber.toString().padStart(2, ' ')}</span>
                  {tokens.map((token, tokenIndex) => {
                    if (token.type === 'text') {
                      // Render highlighted code using dangerouslySetInnerHTML
                      return (
                        <span
                          key={tokenIndex}
                          dangerouslySetInnerHTML={{ __html: token.highlighted || token.value }}
                          className="inline"
                        />
                      );
                    } else {
                      const userAnswer = userAnswers[token.id] || '';
                      return (
                        <input
                          key={tokenIndex}
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(token.id, e.target.value)}
                          placeholder={`___${token.id}___`}
                          className="inline-block min-w-[100px] px-2 py-0.5 mx-0.5 bg-slate-900 border border-slate-600 rounded text-slate-200 font-mono text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 placeholder:text-slate-500 align-baseline"
                        />
                      );
                    }
                  })}
                  {lineIndex < tokenizedLines.length - 1 && '\n'}
                </React.Fragment>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
};

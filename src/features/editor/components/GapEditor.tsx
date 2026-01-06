import React from 'react'
import type { Gap } from '../../gapEngine/lib/generateGaps'
import GapToken from './GapToken'

export interface GapEditorProps {
  code: string
  gaps: Gap[]
  answers: Record<string, string>
  onAnswersChange: (answers: Record<string, string>) => void
  showHints?: boolean
}

const GAP_HINTS: Record<Gap['type'], string> = {
  functionName: 'This is a function name',
  param: 'This is a function parameter',
  keyword: 'This is a JavaScript keyword',
  variable: 'This is a variable name',
}

function filterAndSortGaps(gaps: Gap[]): Gap[] {
  // Filter out zero-length and overlapping/duplicate gaps
  const sorted = [...gaps]
    .filter(gap => gap.end > gap.start)
    .sort((a, b) => a.start - b.start)
  const filtered: Gap[] = []
  let lastEnd = -1
  for (const gap of sorted) {
    if (gap.start >= lastEnd) {
      filtered.push(gap)
      lastEnd = gap.end
    }
  }
  return filtered
}

const GapEditor: React.FC<GapEditorProps> = ({ code, gaps, answers, onAnswersChange, showHints }) => {
  const filteredGaps = filterAndSortGaps(gaps)
  const parts: React.ReactNode[] = []
  let lastIdx = 0
  filteredGaps.forEach((gap, i) => {
    if (gap.start > lastIdx) {
      parts.push(<span key={`code-${i}`}>{code.slice(lastIdx, gap.start)}</span>)
    }
    parts.push(
      <GapToken
        key={gap.id}
        id={gap.id}
        value={answers[gap.id] || ''}
        onChange={val => onAnswersChange({ ...answers, [gap.id]: val })}
        hint={showHints ? GAP_HINTS[gap.type] : undefined}
      />
    )
    lastIdx = gap.end
  })
  if (lastIdx < code.length) {
    parts.push(<span key="code-end">{code.slice(lastIdx)}</span>)
  }
  return (
    <pre style={{ background: '#f6f8fa', padding: 16, borderRadius: 8, fontFamily: 'monospace', fontSize: 16, overflowX: 'auto' }}>
      {parts}
    </pre>
  )
}

export default GapEditor 
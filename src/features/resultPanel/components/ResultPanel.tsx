import React from 'react'
import type { Gap } from '../../gapEngine/lib/generateGaps'

export interface ResultPanelProps {
  gaps: Gap[]
  answers: Record<string, string>
}

const ResultPanel: React.FC<ResultPanelProps> = ({ gaps, answers }) => (
  <ul>
    {gaps.map(gap => {
      const userAnswer = answers[gap.id] || ''
      const isCorrect = userAnswer.trim() === gap.original
      return (
        <li key={gap.id} style={{ color: isCorrect ? 'green' : 'red' }}>
          Gap {gap.id}: {isCorrect ? 'Correct' : 'Incorrect'} (Your answer: "{userAnswer}", Expected: "{gap.original}")
        </li>
      )
    })}
  </ul>
)

export default ResultPanel 
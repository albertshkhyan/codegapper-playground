import { useCodeInput } from '../features/codeInput/hooks/useCodeInput'
import CodeTextarea from '../features/codeInput/components/CodeTextarea'
import { useGapStore } from '../features/gapEngine/model/useGapStore'
import { generateGaps } from '../features/gapEngine/lib/generateGaps'
import GapEditor from '../features/editor/components/GapEditor'
import { useResultStore } from '../features/resultPanel/model/resultStore'
import ResultPanel from '../features/resultPanel/components/ResultPanel'
import { useState } from 'react'
import SaveButton from '../features/savedSessions/components/SaveButton'
import SessionDropdown from '../features/savedSessions/components/SessionDropdown'
import { useSettingsStore } from '../features/uiSettings/model/settingsStore'
import type { GapType } from '../features/uiSettings/model/settingsStore'
import React from 'react'

const GAP_TYPE_LABELS: Record<string, string> = {
  identifier: 'Identifiers',
  operator: 'Operators',
  propertyAccess: 'Property Accesses',
  objectKey: 'Object Keys',
  literal: 'Literals',
  template: 'Template Elements',
}

function App() {
  const { code, setCode } = useCodeInput()
  const { gaps, setGaps } = useGapStore()
  const { answers, setAnswers } = useResultStore()
  const [showResults, setShowResults] = useState(false)
  const { theme, setTheme, difficulty, setDifficulty, showHints, setShowHints, allowedGapTypes, setAllowedGapTypes } = useSettingsStore()

  // Difficulty logic - filter user selections based on difficulty
  // If difficulty filtering results in empty array, use user's original selections (don't force no filtering)
  let allowedGapTypesForDifficulty: (string | GapType)[] = allowedGapTypes
  let maxGaps = 5
  if (difficulty === 'easy') {
    const easyTypes = ['identifier', 'literal']
    const filtered = allowedGapTypes.filter(t => easyTypes.includes(t))
    // If filtering results in empty, keep user selections to avoid "no filtering" behavior
    allowedGapTypesForDifficulty = filtered.length > 0 ? filtered : allowedGapTypes
    maxGaps = 2
  } else if (difficulty === 'medium') {
    const mediumTypes = ['identifier', 'literal', 'objectKey']
    const filtered = allowedGapTypes.filter(t => mediumTypes.includes(t))
    allowedGapTypesForDifficulty = filtered.length > 0 ? filtered : allowedGapTypes
    maxGaps = 4
  } else if (difficulty === 'hard') {
    allowedGapTypesForDifficulty = allowedGapTypes // All types allowed in hard mode
    maxGaps = 6
  }

  // Sync allowedGapTypes in store with difficulty
  React.useEffect(() => {
    setAllowedGapTypes(allowedGapTypesForDifficulty as GapType[])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty])

  const handleGapTypeChange = (type: GapType) => {
    if (allowedGapTypes.includes(type)) {
      setAllowedGapTypes(allowedGapTypes.filter(t => t !== type))
    } else {
      setAllowedGapTypes([...allowedGapTypes, type])
    }
  }

  const handleGenerateGaps = () => {
    console.log('[DEBUG App] Generate gaps called:', JSON.stringify({
      codeLength: code.length,
      allowedGapTypes: allowedGapTypes,
      allowedGapTypesForDifficulty,
      difficulty,
      maxGaps
    }, null, 2));
    const newGaps = generateGaps(code, allowedGapTypesForDifficulty as GapType[], maxGaps)
    console.log('[DEBUG App] Gaps received:', JSON.stringify({
      count: newGaps.length,
      types: newGaps.map(g => g.type),
      gaps: newGaps.map(g => ({ id: g.id, type: g.type, original: g.original }))
    }, null, 2));
    setGaps(newGaps)
    setAnswers({})
    setShowResults(false)
  }

  const handleCheckAnswers = () => {
    setShowResults(true)
  }

  return (
    <>
      <main
        style={{
          maxWidth: 600,
          margin: '2rem auto',
          padding: 16,
          background: theme === 'dark' ? '#222' : '#fff',
          color: theme === 'dark' ? '#eee' : '#222',
          minHeight: '100vh',
          borderRadius: 8,
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        <h1>CodeGapper Playground</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <SaveButton />
          <SessionDropdown />
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <label>
            Theme:
            <select value={theme} onChange={e => setTheme(e.target.value as 'light' | 'dark')}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Difficulty:
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label>
            <input type="checkbox" checked={showHints} onChange={e => setShowHints(e.target.checked)} />
            Show Hints
          </label>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600 }}>Gap Types:</legend>
            {Object.entries(GAP_TYPE_LABELS).map(([type, label]) => (
              <label key={type} style={{ marginRight: 8 }}>
                <input
                  type="checkbox"
                  checked={allowedGapTypes.includes(type as GapType)}
                  onChange={() => handleGapTypeChange(type as GapType)}
                />
                {label}
              </label>
            ))}
          </fieldset>
        </div>
        <CodeTextarea
          value={code}
          onChange={setCode}
          placeholder="Paste or type your JavaScript code here..."
        />
        <button style={{ margin: '1rem 0', padding: '0.5rem 1rem' }} onClick={handleGenerateGaps}>
          Generate Gaps
        </button>
        <section>
          <h2>Fill the Gaps</h2>
          <GapEditor code={code} gaps={gaps} answers={answers} onAnswersChange={setAnswers} showHints={showHints} />
          <button style={{ margin: '1rem 0', padding: '0.5rem 1rem' }} onClick={handleCheckAnswers} disabled={gaps.length === 0}>
            Check Answers
          </button>
          {showResults && <ResultPanel gaps={gaps} answers={answers} />}
        </section>
      </main>
    </>
  )
}

export default App

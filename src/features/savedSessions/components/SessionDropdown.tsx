import React from 'react'
import { useSessionStore } from '../model/sessionStore'
import { useGapStore } from '../../gapEngine/model/useGapStore'
import { useResultStore } from '../../resultPanel/model/resultStore'
import type { Gap } from '../../gapEngine/lib/generateGaps'

const SessionDropdown: React.FC = () => {
  const { allSessions, load, setSessionName } = useSessionStore()
  const { setGaps, setCode } = useGapStore()
  const { setAnswers } = useResultStore()
  const sessions = allSessions()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value
    if (!name) return
    const session = load(name)
    if (session) {
      setSessionName(name)
      setCode(session.code)
      setGaps(session.gaps as Gap[])
      setAnswers(session.answers)
    }
  }

  return (
    <select onChange={handleChange} defaultValue="">
      <option value="" disabled>
        Load Session
      </option>
      {Object.keys(sessions).map(name => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  )
}

export default SessionDropdown 
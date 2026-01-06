import React from 'react'
import { useSessionStore } from '../model/sessionStore'
import { useGapStore } from '../../gapEngine/model/useGapStore'
import { useResultStore } from '../../resultPanel/model/resultStore'

const SaveButton: React.FC = () => {
  const { sessionName, setSessionName, save } = useSessionStore()
  const { code, gaps } = useGapStore()
  const { answers } = useResultStore()

  const handleSave = () => {
    let name = sessionName
    if (!name) {
      name = prompt('Enter a name for this session:') || ''
      if (!name) return
      setSessionName(name)
    }
    save(name, { code, gaps, answers })
    alert('Session saved!')
  }

  return (
    <button onClick={handleSave} style={{ marginRight: 8 }}>
      Save Session
    </button>
  )
}

export default SaveButton 
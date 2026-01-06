import { useState } from 'react'

export function useCodeInput(initial: string = '') {
  const [code, setCode] = useState<string>(initial)
  return { code, setCode }
} 
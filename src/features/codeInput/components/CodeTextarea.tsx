import React from 'react'

export interface CodeTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const CodeTextarea: React.FC<CodeTextareaProps> = ({ value, onChange, placeholder, className }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className={className}
    rows={10}
    style={{ width: '100%', fontFamily: 'monospace', fontSize: 16 }}
  />
)

export default CodeTextarea 
import React from 'react'

export interface GapTokenProps {
  id: string
  value: string
  onChange: (value: string) => void
  hint?: string
}

const GapToken: React.FC<GapTokenProps> = ({ id, value, onChange, hint }) => (
  <span style={{ display: 'inline-block', textAlign: 'center', margin: '0 2px' }}>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: 80, fontFamily: 'monospace', fontSize: 16 }}
      data-gap-id={id}
      autoComplete="off"
    />
    {hint && (
      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{hint}</div>
    )}
  </span>
)

export default GapToken 
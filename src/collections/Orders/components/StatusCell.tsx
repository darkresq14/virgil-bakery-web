'use client'

import { useState } from 'react'

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  nou: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  confirmat: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  livrat: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
  anulat: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
}

const STATUS_OPTIONS = [
  { label: 'Nou', value: 'nou' },
  { label: 'Confirmat', value: 'confirmat' },
  { label: 'Livrat', value: 'livrat' },
  { label: 'Anulat', value: 'anulat' },
]

export const StatusCell = ({
  cellData,
  rowData,
}: {
  cellData: string
  rowData: Record<string, unknown>
}) => {
  const [status, setStatus] = useState(cellData || 'nou')
  const [saving, setSaving] = useState(false)

  const handleChange = async (newStatus: string) => {
    const previous = status
    setStatus(newStatus)
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${rowData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setStatus(previous)
    }
    setSaving(false)
  }

  const colors = STATUS_STYLES[status] || STATUS_STYLES.nou

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        padding: '2px 6px',
        fontSize: '12px',
        fontWeight: 500,
        outline: 'none',
        cursor: saving ? 'wait' : 'pointer',
        opacity: saving ? 0.5 : 1,
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

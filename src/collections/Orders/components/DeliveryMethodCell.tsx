'use client'

const DELIVERY_METHOD_STYLES: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  personal: { bg: '#dcfce7', text: '#166534', border: '#86efac', icon: '🚗', label: 'Personală' },
  curier: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', icon: '📦', label: 'Curier' },
}

export const DeliveryMethodCell = ({ cellData }: { cellData: string }) => {
  const method = DELIVERY_METHOD_STYLES[cellData]

  if (!method) {
    return <span style={{ color: '#9ca3af' }}>—</span>
  }

  return (
    <span
      style={{
        backgroundColor: method.bg,
        color: method.text,
        border: `1px solid ${method.border}`,
        borderRadius: '9999px',
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {method.icon} {method.label}
    </span>
  )
}

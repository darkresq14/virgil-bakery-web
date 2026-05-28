'use client'

interface OrderItem {
  name?: string
  quantity?: number
  price?: number
}

export const ItemsCell = ({ cellData }: { cellData: unknown }) => {
  const items = (Array.isArray(cellData) ? cellData : []) as OrderItem[]

  if (items.length === 0) return <span style={{ color: '#9ca3af' }}>—</span>

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: '13px', lineHeight: '1.4' }}>
          {item.quantity}× {item.name}
        </li>
      ))}
    </ul>
  )
}

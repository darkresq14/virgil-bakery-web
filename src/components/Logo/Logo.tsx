import React from 'react'

interface Props {
  className?: string
}

export const Logo = (props: Props) => {
  const { className } = props

  return (
    <span className={`flex items-center gap-2 ${className || ''}`}>
      <span className="font-heading text-xl md:text-2xl font-bold tracking-tight">
        Pâine cu Maia
      </span>
    </span>
  )
}

import React from 'react'

import { CartProvider } from './Cart'
import { ToastProvider } from '@/components/Toast'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <CartProvider>
      <ToastProvider>{children}</ToastProvider>
    </CartProvider>
  )
}

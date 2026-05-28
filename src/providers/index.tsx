import type React from 'react'
import { ToastProvider } from '@/components/Toast'
import { CartProvider } from './Cart'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <CartProvider>
      <ToastProvider>{children}</ToastProvider>
    </CartProvider>
  )
}

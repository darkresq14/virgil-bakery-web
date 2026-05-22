'use client'

import React, { createContext, useCallback, use, useState } from 'react'

interface Toast {
  id: number
  message: string
}

interface ToastContextType {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => null })

export const useToast = () => use(ToastContext)

let toastId = 0

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="rounded-lg bg-foreground text-background px-4 py-3 shadow-lg text-sm font-sans animate-[slideUp_0.3s_ease-out]"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext>
  )
}

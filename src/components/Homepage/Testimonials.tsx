'use client'

import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

interface Testimonial {
  id: string
  author: string
  content: string
  language?: string
}

interface TestimonialsProps {
  testimonials: Testimonial[]
}

export const Testimonials: React.FC<TestimonialsProps> = ({ testimonials }) => {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (testimonials.length <= 1 || paused) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length, paused])

  if (!testimonials.length) return null

  return (
    <section className="py-20 bg-secondary/50" aria-label="Testimoniale clienți">
      <div className="container">
        <h2 className="text-3xl font-heading text-center mb-12">Ce spun clienții</h2>

        <div
          className="max-w-3xl mx-auto text-center"
          aria-roledescription="carusel"
          aria-label="Testimoniale"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <Quote className="w-12 h-12 text-primary/30 mx-auto mb-6" aria-hidden="true" />
          <div className="relative">
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                className={`text-center transition-opacity duration-500 ${
                  i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
                } ${i !== 0 ? 'absolute inset-0 flex flex-col items-center justify-center' : ''}`}
                aria-hidden={i !== current}
              >
                <blockquote className="text-lg md:text-xl font-serif italic text-foreground/80 mb-6">
                  &ldquo;{t.content}&rdquo;
                </blockquote>
                <cite className="font-sans font-medium text-foreground not-italic">
                  — {t.author}
                </cite>
              </div>
            ))}
          </div>
        </div>

        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() =>
                setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)
              }
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Testimonialul anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === current ? 'bg-primary' : 'bg-foreground/20'
                  }`}
                  aria-label={`Testimonialul ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % testimonials.length)}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Următorul testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

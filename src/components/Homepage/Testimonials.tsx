'use client'

import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

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

  useEffect(() => {
    if (testimonials.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  if (!testimonials.length) return null

  const testimonial = testimonials[current]

  return (
    <section className="py-20 bg-secondary/50">
      <div className="container">
        <h2 className="text-3xl font-heading text-center mb-12">Ce spun clienții</h2>

        <div className="max-w-3xl mx-auto text-center">
          <Quote className="w-12 h-12 text-primary/30 mx-auto mb-6" />
          <blockquote className="text-lg md:text-xl font-serif italic text-foreground/80 mb-6 min-h-[6rem]">
            &ldquo;{testimonial.content}&rdquo;
          </blockquote>
          <p className="font-sans font-medium text-foreground">— {testimonial.author}</p>
        </div>

        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
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

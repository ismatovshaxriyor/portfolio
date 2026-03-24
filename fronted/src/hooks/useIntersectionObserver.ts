import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

interface ObserverOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useIntersectionObserver<T extends Element>(
  options: ObserverOptions = {}
): [RefObject<T>, boolean] {
  const { threshold = 0.2, rootMargin = '0px', once = true } = options
  const elementRef = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            observer.disconnect()
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [once, rootMargin, threshold])

  return [elementRef, isVisible]
}

import { useEffect, useRef, useState } from 'react'

interface TypingOptions {
  typeSpeed?: number
  deleteSpeed?: number
  holdDelay?: number
}

interface TypingState {
  text: string
  isHolding: boolean
}

export function useTypingEffect(words: readonly string[], options: TypingOptions = {}): TypingState {
  const { typeSpeed = 72, deleteSpeed = 48, holdDelay = 1700 } = options
  const [text, setText] = useState('')
  const [isHolding, setIsHolding] = useState(false)

  const wordIndexRef = useRef(0)
  const charIndexRef = useRef(0)
  const deletingRef = useRef(false)

  useEffect(() => {
    if (!words.length) {
      return
    }

    let timeoutId: number | undefined

    const step = () => {
      const currentWord = words[wordIndexRef.current]

      if (!deletingRef.current) {
        charIndexRef.current += 1
        setText(currentWord.slice(0, charIndexRef.current))

        if (charIndexRef.current === currentWord.length) {
          setIsHolding(true)
          timeoutId = window.setTimeout(() => {
            deletingRef.current = true
            setIsHolding(false)
            step()
          }, holdDelay)
          return
        }

        timeoutId = window.setTimeout(step, typeSpeed)
        return
      }

      charIndexRef.current -= 1
      setText(currentWord.slice(0, charIndexRef.current))

      if (charIndexRef.current === 0) {
        deletingRef.current = false
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length
        timeoutId = window.setTimeout(step, typeSpeed)
        return
      }

      timeoutId = window.setTimeout(step, deleteSpeed)
    }

    timeoutId = window.setTimeout(step, typeSpeed)

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [deleteSpeed, holdDelay, typeSpeed, words])

  return { text, isHolding }
}

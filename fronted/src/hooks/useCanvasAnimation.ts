import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface NodePoint {
  x: number
  y: number
  vx: number
  vy: number
  driftAmp: number
  driftSpeed: number
  phase: number
  alpha: number
  minAlpha: number
  maxAlpha: number
  targetAlpha: number
  fadeSpeed: number
  radius: number
  color: string
  glyph: GlyphType
}

interface PointerState {
  x: number
  y: number
  active: boolean
}

interface CanvasState {
  rafId: number
  points: NodePoint[]
  pointer: PointerState
  width: number
  height: number
  quietZone: QuietZone
  softMode: boolean
}

interface QuietZone {
  left: number
  right: number
  top: number
  bottom: number
  softenDistance: number
  innerFactor: number
}

type GlyphType = 'bot' | 'bug' | 'server' | 'api'
const MOBILE_HEIGHT_JITTER_THRESHOLD = 140
const ORIENTATION_SHIFT_THRESHOLD = 0.45

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function createQuietZone(width: number, height: number): QuietZone {
  const isMobile = width < 768
  return {
    left: isMobile ? width * 0.05 : width * 0.06,
    right: isMobile ? width * 0.96 : Math.min(width * 0.72, width - 72),
    top: isMobile ? height * 0.14 : height * 0.12,
    bottom: isMobile ? Math.min(height * 0.72, height - 70) : Math.min(height * 0.74, height - 72),
    softenDistance: isMobile ? 110 : 150,
    innerFactor: 0.36
  }
}

function getContentQuietFactor(x: number, y: number, quietZone: QuietZone): number {
  const dx = Math.max(quietZone.left - x, 0, x - quietZone.right)
  const dy = Math.max(quietZone.top - y, 0, y - quietZone.bottom)
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance === 0) {
    return quietZone.innerFactor
  }

  if (distance >= quietZone.softenDistance) {
    return 1
  }

  const t = distance / quietZone.softenDistance
  return quietZone.innerFactor + (1 - quietZone.innerFactor) * t
}

const POINT_PALETTE = [
  { color: '255, 255, 255', weight: 0.52 },
  { color: '59, 130, 246', weight: 0.24 },
  { color: '239, 68, 68', weight: 0.24 }
] as const

const GLYPH_PALETTE: ReadonlyArray<{ glyph: GlyphType; weight: number }> = [
  { glyph: 'bot', weight: 0.32 },
  { glyph: 'bug', weight: 0.23 },
  { glyph: 'server', weight: 0.24 },
  { glyph: 'api', weight: 0.21 }
]

function pickPointColor(): string {
  const random = Math.random()
  let acc = 0

  for (const entry of POINT_PALETTE) {
    acc += entry.weight
    if (random <= acc) {
      return entry.color
    }
  }

  return POINT_PALETTE[0].color
}

function pickGlyph(): GlyphType {
  const random = Math.random()
  let acc = 0

  for (const entry of GLYPH_PALETTE) {
    acc += entry.weight
    if (random <= acc) {
      return entry.glyph
    }
  }

  return GLYPH_PALETTE[0].glyph
}

function drawGlyph(
  context: CanvasRenderingContext2D,
  glyph: GlyphType,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number
): void {
  const strokeAlpha = clamp(alpha, 0.05, 1)
  const fillAlpha = clamp(alpha * 0.28, 0.02, 0.6)
  const lineWidth = clamp(size * 0.24, 1, 2.4)
  const dotRadius = clamp(size * 0.11, 0.95, 2.4)

  context.save()
  context.translate(x, y)
  context.strokeStyle = `rgba(${color}, ${strokeAlpha})`
  context.fillStyle = `rgba(${color}, ${fillAlpha})`
  context.lineWidth = lineWidth
  context.lineCap = 'round'
  context.lineJoin = 'round'

  if (glyph === 'bot') {
    context.beginPath()
    context.rect(-size * 0.54, -size * 0.34, size * 1.08, size * 0.76)
    context.stroke()

    context.beginPath()
    context.moveTo(0, -size * 0.58)
    context.lineTo(0, -size * 0.34)
    context.stroke()

    context.beginPath()
    context.arc(0, -size * 0.64, dotRadius, 0, Math.PI * 2)
    context.fill()

    context.beginPath()
    context.arc(-size * 0.2, -size * 0.02, dotRadius, 0, Math.PI * 2)
    context.arc(size * 0.2, -size * 0.02, dotRadius, 0, Math.PI * 2)
    context.fill()

    context.beginPath()
    context.moveTo(-size * 0.22, size * 0.2)
    context.lineTo(size * 0.22, size * 0.2)
    context.stroke()
  } else if (glyph === 'bug') {
    context.beginPath()
    context.ellipse(0, size * 0.06, size * 0.34, size * 0.46, 0, 0, Math.PI * 2)
    context.stroke()

    context.beginPath()
    context.moveTo(0, -size * 0.4)
    context.lineTo(0, size * 0.42)
    context.stroke()

    context.beginPath()
    context.moveTo(-size * 0.16, -size * 0.36)
    context.lineTo(-size * 0.36, -size * 0.58)
    context.moveTo(size * 0.16, -size * 0.36)
    context.lineTo(size * 0.36, -size * 0.58)
    context.stroke()

    context.beginPath()
    context.moveTo(-size * 0.34, -size * 0.12)
    context.lineTo(-size * 0.56, -size * 0.26)
    context.moveTo(size * 0.34, -size * 0.12)
    context.lineTo(size * 0.56, -size * 0.26)
    context.moveTo(-size * 0.34, size * 0.12)
    context.lineTo(-size * 0.56, size * 0.24)
    context.moveTo(size * 0.34, size * 0.12)
    context.lineTo(size * 0.56, size * 0.24)
    context.stroke()
  } else if (glyph === 'server') {
    context.beginPath()
    context.rect(-size * 0.58, -size * 0.46, size * 1.16, size * 0.4)
    context.rect(-size * 0.58, size * 0.08, size * 1.16, size * 0.4)
    context.stroke()

    context.beginPath()
    context.arc(-size * 0.32, -size * 0.26, dotRadius, 0, Math.PI * 2)
    context.arc(-size * 0.32, size * 0.28, dotRadius, 0, Math.PI * 2)
    context.fill()

    context.beginPath()
    context.moveTo(-size * 0.06, -size * 0.26)
    context.lineTo(size * 0.36, -size * 0.26)
    context.moveTo(-size * 0.06, size * 0.28)
    context.lineTo(size * 0.36, size * 0.28)
    context.stroke()
  } else {
    context.beginPath()
    context.moveTo(-size * 0.56, -size * 0.3)
    context.lineTo(-size * 0.24, 0)
    context.lineTo(-size * 0.56, size * 0.3)
    context.stroke()

    context.beginPath()
    context.moveTo(size * 0.56, -size * 0.3)
    context.lineTo(size * 0.24, 0)
    context.lineTo(size * 0.56, size * 0.3)
    context.stroke()

    context.beginPath()
    context.moveTo(size * 0.06, -size * 0.46)
    context.lineTo(-size * 0.08, size * 0.46)
    context.stroke()
  }

  context.restore()
}

function createPoint(width: number, height: number, softMode = false, emerging = false): NodePoint {
  const minAlpha = (softMode ? 0.14 : 0.05) + Math.random() * (softMode ? 0.14 : 0.16)
  const maxAlpha = (softMode ? 0.56 : 0.62) + Math.random() * (softMode ? 0.28 : 0.33)
  const shouldStartDim = emerging || Math.random() < 0.52
  const alpha = shouldStartDim ? minAlpha + Math.random() * 0.045 : maxAlpha - Math.random() * 0.05

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    driftAmp: 0.08 + Math.random() * 0.2,
    driftSpeed: 0.00048 + Math.random() * 0.00078,
    phase: Math.random() * Math.PI * 2,
    alpha,
    minAlpha,
    maxAlpha,
    targetAlpha: shouldStartDim ? maxAlpha : minAlpha,
    fadeSpeed: softMode ? 0.0012 + Math.random() * 0.0024 : 0.0016 + Math.random() * 0.0032,
    radius: 4.08 + Math.random() * 4.4,
    color: pickPointColor(),
    glyph: pickGlyph()
  }
}

function respawnPoint(point: NodePoint, width: number, height: number, softMode: boolean): void {
  const next = createPoint(width, height, softMode, true)
  point.x = next.x
  point.y = next.y
  point.vx = next.vx
  point.vy = next.vy
  point.driftAmp = next.driftAmp
  point.driftSpeed = next.driftSpeed
  point.phase = next.phase
  point.alpha = next.alpha
  point.minAlpha = next.minAlpha
  point.maxAlpha = next.maxAlpha
  point.targetAlpha = next.targetAlpha
  point.fadeSpeed = next.fadeSpeed
  point.radius = next.radius
  point.color = next.color
  point.glyph = next.glyph
}

function createPoints(width: number, height: number, softMode: boolean): NodePoint[] {
  const area = width * height
  const count = clamp(Math.floor(area / 13200), 74, 210)
  const points: NodePoint[] = []

  for (let index = 0; index < count; index += 1) {
    points.push(createPoint(width, height, softMode))
  }

  return points
}

function adaptPointsForResize(
  points: NodePoint[],
  oldWidth: number,
  oldHeight: number,
  width: number,
  height: number,
  softMode: boolean
): NodePoint[] {
  const targetCount = clamp(Math.floor((width * height) / 13200), 74, 210)
  const scaleX = width / Math.max(1, oldWidth)
  const scaleY = height / Math.max(1, oldHeight)
  const adjusted: NodePoint[] = points.slice(0, targetCount).map((point) => ({
    ...point,
    x: clamp(point.x * scaleX, 0, width),
    y: clamp(point.y * scaleY, 0, height)
  }))

  while (adjusted.length < targetCount) {
    adjusted.push(createPoint(width, height, softMode, true))
  }

  return adjusted
}

function clampPointsToViewport(points: NodePoint[], width: number, height: number): NodePoint[] {
  return points.map((point) => ({
    ...point,
    x: clamp(point.x, 0, width),
    y: clamp(point.y, 0, height)
  }))
}

export function useCanvasAnimation(canvasRef: RefObject<HTMLCanvasElement>) {
  const stateRef = useRef<CanvasState | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    })
    if (!context) {
      return
    }

    let resizeRafId: number | null = null

    const applyResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = window.innerWidth
      const height = window.innerHeight

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const previousState = stateRef.current
      const nextPointer: PointerState = previousState?.pointer ?? {
        x: width / 2,
        y: height / 2,
        active: false
      }
      const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
      const softMode = isCoarsePointer || width < 820

      let nextPoints: NodePoint[]
      if (!previousState) {
        nextPoints = createPoints(width, height, softMode)
      } else {
        const widthDelta = Math.abs(previousState.width - width)
        const heightDelta = Math.abs(previousState.height - height)
        const previousAspect = previousState.width / Math.max(1, previousState.height)
        const nextAspect = width / Math.max(1, height)
        const aspectShift = Math.abs(nextAspect - previousAspect) / Math.max(0.001, previousAspect)
        const jitterResize = isCoarsePointer && widthDelta < 2 && heightDelta < MOBILE_HEIGHT_JITTER_THRESHOLD

        if (jitterResize) {
          nextPoints = clampPointsToViewport(previousState.points, width, height)
        } else if (aspectShift > ORIENTATION_SHIFT_THRESHOLD) {
          nextPoints = createPoints(width, height, softMode)
        } else {
          nextPoints = adaptPointsForResize(
            previousState.points,
            previousState.width,
            previousState.height,
            width,
            height,
            softMode
          )
        }
      }

      stateRef.current = {
        rafId: previousState?.rafId ?? 0,
        points: nextPoints,
        pointer: nextPointer,
        width,
        height,
        quietZone: createQuietZone(width, height),
        softMode
      }
    }

    const resize = () => {
      if (resizeRafId !== null) {
        window.cancelAnimationFrame(resizeRafId)
      }
      resizeRafId = window.requestAnimationFrame(() => {
        resizeRafId = null
        applyResize()
      })
    }

    const onPointerMove = (event: PointerEvent) => {
      const state = stateRef.current
      if (!state) {
        return
      }
      if (event.pointerType === 'touch') {
        return
      }

      state.pointer.x = event.clientX
      state.pointer.y = event.clientY
      state.pointer.active = true
    }

    const onPointerLeave = () => {
      const state = stateRef.current
      if (!state) {
        return
      }
      state.pointer.active = false
    }

    const draw = () => {
      const state = stateRef.current
      if (!state) {
        return
      }

      const width = state.width
      const height = state.height
      const points = state.points
      const influenceRadius = 160
      const influenceRadiusSq = influenceRadius * influenceRadius
      const lineDistance = 115
      const lineDistanceSq = lineDistance * lineDistance
      const maxSpeed = 0.62
      const friction = 0.992
      const now = performance.now()
      const gridCols = Math.max(1, Math.ceil(width / lineDistance))
      const cellX = new Int16Array(points.length)
      const cellY = new Int16Array(points.length)
      const quietFactors = new Float32Array(points.length)
      const buckets = new Map<number, number[]>()

      context.clearRect(0, 0, width, height)
      context.lineWidth = 0.86

      for (let i = 0; i < points.length; i += 1) {
        const point = points[i]
        if (state.pointer.active) {
          const dx = point.x - state.pointer.x
          const dy = point.y - state.pointer.y
          const distSq = dx * dx + dy * dy

          if (distSq > 0 && distSq < influenceRadiusSq) {
            const distance = Math.sqrt(distSq)
            const strength = (1 - distance / influenceRadius) * 0.012
            point.vx += (dx / distance) * strength
            point.vy += (dy / distance) * strength
          }
        }

        point.vx *= friction
        point.vy *= friction
        point.vx = clamp(point.vx, -maxSpeed, maxSpeed)
        point.vy = clamp(point.vy, -maxSpeed, maxSpeed)

        const driftX = Math.sin(now * point.driftSpeed + point.phase) * point.driftAmp
        const driftY = Math.cos(now * point.driftSpeed + point.phase * 0.8) * point.driftAmp

        point.x += point.vx + driftX
        point.y += point.vy + driftY

        if (point.alpha < point.targetAlpha) {
          point.alpha = Math.min(point.alpha + point.fadeSpeed, point.targetAlpha)
        } else if (point.alpha > point.targetAlpha) {
          point.alpha = Math.max(point.alpha - point.fadeSpeed, point.targetAlpha)
        }

        const reachedTarget = Math.abs(point.alpha - point.targetAlpha) < 0.004
        if (reachedTarget) {
          if (point.targetAlpha <= point.minAlpha + 0.001) {
            if (state.softMode) {
              point.targetAlpha = point.maxAlpha
            } else {
              respawnPoint(point, width, height, state.softMode)
            }
          } else {
            point.targetAlpha = point.minAlpha
          }
        }

        if (point.x < 0 || point.x > width) {
          point.vx *= -1
          point.x = clamp(point.x, 0, width)
        }
        if (point.y < 0 || point.y > height) {
          point.vy *= -1
          point.y = clamp(point.y, 0, height)
        }

        quietFactors[i] = getContentQuietFactor(point.x, point.y, state.quietZone)

        const xCell = Math.floor(point.x / lineDistance)
        const yCell = Math.floor(point.y / lineDistance)
        cellX[i] = xCell
        cellY[i] = yCell
        const cellKey = yCell * gridCols + xCell
        const bucket = buckets.get(cellKey)
        if (bucket) {
          bucket.push(i)
        } else {
          buckets.set(cellKey, [i])
        }
      }

      for (let i = 0; i < points.length; i += 1) {
        const p1 = points[i]
        const q1 = quietFactors[i]
        let connections = 0
        const baseCellX = cellX[i]
        const baseCellY = cellY[i]

        for (let offsetY = -1; offsetY <= 1 && connections < 3; offsetY += 1) {
          const neighborY = baseCellY + offsetY
          if (neighborY < 0) {
            continue
          }

          for (let offsetX = -1; offsetX <= 1 && connections < 3; offsetX += 1) {
            const neighborX = baseCellX + offsetX
            if (neighborX < 0 || neighborX >= gridCols) {
              continue
            }

            const bucket = buckets.get(neighborY * gridCols + neighborX)
            if (!bucket) {
              continue
            }

            for (let bucketIndex = 0; bucketIndex < bucket.length; bucketIndex += 1) {
              if (connections >= 3) {
                break
              }

              const j = bucket[bucketIndex]
              if (j <= i) {
                continue
              }

              const p2 = points[j]
              const dx = p1.x - p2.x
              const dy = p1.y - p2.y
              const distSq = dx * dx + dy * dy

              if (distSq < lineDistanceSq) {
                const q2 = quietFactors[j]
                const quietBlend = (q1 + q2) * 0.5
                const distanceRatio = 1 - distSq / lineDistanceSq
                const alpha = clamp(
                  Math.min(p1.alpha, p2.alpha) * distanceRatio * 0.72 * quietBlend * quietBlend,
                  0,
                  0.98
                )
                context.strokeStyle = `rgba(255, 255, 255, ${alpha})`
                context.beginPath()
                context.moveTo(p1.x, p1.y)
                context.lineTo(p2.x, p2.y)
                context.stroke()
                connections += 1
              }
            }
          }
        }
      }

      for (let i = 0; i < points.length; i += 1) {
        const point = points[i]
        const quietFactor = quietFactors[i]
        const colorBoost = point.color === '255, 255, 255' ? 1 : 1.28
        const minVisibleAlpha = state.softMode ? 0.08 : 0.03
        const alpha = clamp(point.alpha * quietFactor * 1.06 * colorBoost, minVisibleAlpha, 1)
        const radius = point.radius * (0.9 + quietFactor * 1.02)
        drawGlyph(context, point.glyph, point.x, point.y, radius, point.color, alpha)
      }

      state.rafId = window.requestAnimationFrame(draw)
    }

    applyResize()
    draw()

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)

    return () => {
      const state = stateRef.current
      if (state) {
        window.cancelAnimationFrame(state.rafId)
      }
      if (resizeRafId !== null) {
        window.cancelAnimationFrame(resizeRafId)
      }
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [canvasRef])
}

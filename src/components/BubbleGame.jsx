import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSound from 'use-sound'

const Bubble = ({ x, y, size, onPop, colorIndex }) => {
  const colors = ['#FF9EC8', '#FFD166', '#06D6A0', '#118AB2', '#9B5DE5']
  const color = colors[colorIndex % colors.length]

  return (
    <img
      src={bubblesSvg}
      alt="bubble"
      style={{
        position: 'absolute',
        left: x - size/2,
        top: y - size/2,
        width: size,
        height: size,
        filter: `drop-shadow(0 0 8px ${color}80)`,
        pointerEvents: 'none',
        transform: 'translateZ(0)'
      }}
    />
  )
}

class BubbleManager {
  constructor(x, y, size, canvas, onPop) {
    this.x = x
    this.y = y
    this.size = size
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.vx = (Math.random() - 0.5) * 0.14
    this.vy = -0.07 - Math.random() * 0.1
    this.opacity = 0.85 + Math.random() * 0.15
    // More vibrant colors for the edges
    this.colorVariants = [
      {hue: 200, saturation: 90, lightness: 70},  // Blue
      {hue: 340, saturation: 90, lightness: 75},  // Pink
      {hue: 280, saturation: 80, lightness: 75},  // Purple
      {hue: 50, saturation: 90, lightness: 75},   // Yellow
      {hue: 160, saturation: 80, lightness: 70},  // Teal
    ]
    this.color = this.colorVariants[Math.floor(Math.random() * this.colorVariants.length)]
    this.hue = this.color.hue
    this.rotation = Math.random() * Math.PI * 2
    this.rotationSpeed = (Math.random() - 0.5) * 0.004
    this.wobbleX = Math.random() * Math.PI * 2 // For gentle side-to-side wobble
    this.wobbleSpeed = 0.008 + Math.random() * 0.008
    this.state = 'alive'
    this.onPop = onPop
    this.popTime = 0
    this.popDuration = 360 + Math.random() * 120
    this.particles = []
  }

  // Check collision with another bubble
  checkCollision(other) {
    if (this.state !== 'alive' || other.state !== 'alive') return false
    const dx = this.x - other.x
    const dy = this.y - other.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const minDistance = this.size + other.size + 5 // Minimum gap between bubbles
    return distance < minDistance
  }

  // Separate from other bubbles to avoid overlapping
  separate(bubbles, dt) {
    if (this.state !== 'alive') return

    let separationX = 0
    let separationY = 0
    let count = 0

    bubbles.forEach((other) => {
      if (other === this || other.state !== 'alive') return

      const dx = this.x - other.x
      const dy = this.y - other.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const minDistance = this.size + other.size + 10

      if (distance < minDistance && distance > 0) {
        // Calculate separation force
        const force = (minDistance - distance) / minDistance
        separationX += (dx / distance) * force * 0.5
        separationY += (dy / distance) * force * 0.5
        count++
      }
    })

    if (count > 0) {
      separationX /= count
      separationY /= count
      this.x += separationX * dt
      this.y += separationY * dt
    }
  }

  createParticles() {
    const count = 10 + Math.floor(Math.random() * 6)
    const particles = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.7
      const speed = 0.9 + Math.random() * 0.8
      particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.25,
        life: 0,
        maxLife: 26 + Math.random() * 12,
        size: this.size * (0.15 + Math.random() * 0.1),
        opacity: 0.7 + Math.random() * 0.2,
        hueOffset: Math.random() * 180
      })
    }
    return particles
  }

  updateParticles(dt) {
    if (!this.particles.length) return
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.life += dt
      if (particle.life >= particle.maxLife) {
        this.particles.splice(i, 1)
        continue
      }

      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.vx *= 0.985
      particle.vy = particle.vy * 0.985 + 0.045 * dt
    }
  }

  update(bubbles, delta) {
    if (this.state === 'gone' && !this.particles.length) return

    const dt = delta ? delta / 16.6667 : 1
    const width = this.canvas.width
    const height = this.canvas.height

    if (this.state === 'alive') {
      this.wobbleX += this.wobbleSpeed * dt
      const wobbleAmount = Math.sin(this.wobbleX) * 0.3

      this.x += (this.vx + wobbleAmount) * dt
      this.y += this.vy * dt

      this.rotation += this.rotationSpeed * dt

      if (this.x <= this.size) {
        this.vx = Math.abs(this.vx) * 0.6 + 0.02
        this.x = this.size + 1
      } else if (this.x >= width - this.size) {
        this.vx = -Math.abs(this.vx) * 0.6 - 0.02
        this.x = width - this.size - 1
      }

      if (this.y <= this.size) {
        this.vy = Math.max(0.02, this.vy * 0.4)
        this.y = this.size + 1
      } else if (this.y >= height - this.size) {
        this.vy = -0.05 - Math.random() * 0.08
        this.y = height - this.size - 1
      }

      this.separate(bubbles, dt)
    } else if (this.state === 'popping') {
      this.popTime += delta || 0
      if (this.popTime >= this.popDuration && !this.particles.length) {
        this.state = 'gone'
      }
    }

    this.updateParticles(dt)
  }

  draw() {
    const ctx = this.ctx
    if (this.state === 'gone' && !this.particles.length) return

    if (this.state === 'alive') {
      ctx.save()
      ctx.globalAlpha = this.opacity
      
      // Base bubble - mostly transparent with slight tint
      const baseGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.size
      )
      baseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
      baseGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.05)')
      baseGradient.addColorStop(1, 'rgba(255, 255, 255, 0.02)')
      
      // Draw base bubble
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fillStyle = baseGradient
      ctx.fill()
      
      // Colorful edge effect
      const edgeGradient = ctx.createRadialGradient(
        this.x, this.y, this.size * 0.7,
        this.x, this.y, this.size
      )
      edgeGradient.addColorStop(0, `hsla(${this.color.hue}, 80%, 70%, 0.1)`)
      edgeGradient.addColorStop(0.8, `hsla(${this.color.hue}, 90%, 70%, 0.5)`)
      edgeGradient.addColorStop(1, `hsla(${this.color.hue}, 100%, 80%, 0.7)`)
      
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fillStyle = edgeGradient
      ctx.fill()
      
      // Main highlight (glossy effect)
      const highlightGradient = ctx.createRadialGradient(
        this.x - this.size * 0.4,
        this.y - this.size * 0.4,
        0,
        this.x - this.size * 0.4,
        this.y - this.size * 0.4,
        this.size * 0.8
      )
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      highlightGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)')
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      // Draw highlight with clipping to stay within bubble bounds
      ctx.save()
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.clip()
      
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2)
      ctx.fillStyle = highlightGradient
      ctx.fill()
      ctx.restore()
      
      // Subtle outline
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${this.color.hue}, 80%, 90%, 0.6)`
      ctx.lineWidth = 1.2
      ctx.stroke()
      
      // Small highlight spot
      const spotGradient = ctx.createRadialGradient(
        this.x - this.size * 0.3,
        this.y - this.size * 0.3,
        0,
        this.x - this.size * 0.3,
        this.y - this.size * 0.3,
        this.size * 0.3
      )
      spotGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      spotGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.beginPath()
      ctx.arc(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.25, 0, Math.PI * 2)
      ctx.fillStyle = spotGradient
      ctx.fill()
      
      // Add a subtle reflection at the bottom
      const reflectionGradient = ctx.createRadialGradient(
        this.x + this.size * 0.3,
        this.y + this.size * 0.3,
        0,
        this.x + this.size * 0.3,
        this.y + this.size * 0.3,
        this.size * 0.4
      )
      reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
      reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.beginPath()
      ctx.arc(this.x + this.size * 0.2, this.y + this.size * 0.2, this.size * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = reflectionGradient
      ctx.fill()

      ctx.restore()
    } else if (this.state === 'popping') {
      const progress = Math.min(1, this.popTime / this.popDuration)
      const fade = 1 - progress
      const ringRadius = this.size * (1 + progress * 0.65)
      const innerRadius = this.size * (0.45 + progress * 0.3)
      const hue1 = (this.hue + this.rotation * 15) % 360
      const hue2 = (this.hue + 160) % 360

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = fade * 0.95

      const ringGradient = ctx.createRadialGradient(
        this.x,
        this.y,
        innerRadius * 0.4,
        this.x,
        this.y,
        ringRadius
      )
      ringGradient.addColorStop(0, `hsla(${hue1}, 100%, 92%, ${0.5 * fade})`)
      ringGradient.addColorStop(0.7, `hsla(${hue2}, 85%, 80%, ${0.28 * fade})`)
      ringGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.beginPath()
      ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2)
      ctx.fillStyle = ringGradient
      ctx.fill()

      ctx.beginPath()
      ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2)
      ctx.lineWidth = 2 + progress * 2.5
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.72 * fade})`
      ctx.stroke()

      ctx.beginPath()
      ctx.setLineDash([this.size * 0.65, this.size * 0.35])
      ctx.arc(this.x, this.y, innerRadius * 0.85, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${hue1}, 100%, 95%, ${0.55 * fade})`
      ctx.lineWidth = 1 + progress * 1.4
      ctx.stroke()
      ctx.setLineDash([])

      ctx.restore()
    }

    if (this.particles.length) {
      const ctx = this.ctx
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const particle of this.particles) {
        const lifeRatio = 1 - particle.life / particle.maxLife
        const radius = particle.size * (0.35 + lifeRatio * 0.65)
        const alpha = lifeRatio * particle.opacity
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${(this.hue + particle.hueOffset) % 360}, 95%, 85%, ${0.5 * alpha})`
        ctx.fill()
      }
      ctx.restore()
    }
  }

  isPointInside(x, y) {
    if (this.state !== 'alive') return false
    const dx = x - this.x
    const dy = y - this.y
    return dx * dx + dy * dy <= this.size * this.size
  }

  pop(playSound) {
    if (this.state !== 'alive') return false
    this.state = 'popping'
    this.popTime = 0
    this.particles = this.createParticles()
    if (typeof playSound === 'function') {
      playSound(this.size)
    }
    return true
  }
}

export default function BubbleGame({ onComplete, onExit, backgroundStyle }) {
  const containerRef = useRef(null)
  const bubblesRef = useRef([])
  const animationFrameRef = useRef(null)
  const lastFrameRef = useRef(0)
  const [poppedCount, setPoppedCount] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [playPopSound] = useSound('/bubble-pop.mp3', {
    volume: 0.6,
    interrupt: true
  })

  const BUBBLE_COUNT = 22

  const triggerPopSound = useCallback((size) => {
    const rateBase = 1.12 - Math.min(size, 120) / 220
    const playbackRate = Math.max(0.72, Math.min(1.4, rateBase + (Math.random() - 0.5) * 0.18))
    playPopSound({ playbackRate })
  }, [playPopSound])

  useEffect(() => {
    const canvas = containerRef.current
    if (!canvas) return

    const updateDimensions = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width
      canvas.height = height
      setDimensions({ width, height })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    lastFrameRef.current = 0

    // Initialize bubbles with spacing to avoid initial overlaps
    const bubbles = []
    const minDistance = 150 // Minimum distance between bubble centers

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      let attempts = 0
      let x, y, size
      let validPosition = false

      while (!validPosition && attempts < 50) {
        size = Math.random() * 40 + 50 // 50-90px (slightly smaller for better spacing)
        x = Math.random() * (canvas.width - size * 2) + size
        y = Math.random() * (canvas.height - size * 2) + size

        // Check if this position is far enough from existing bubbles
        validPosition = true
        for (const existingBubble of bubbles) {
          const dx = x - existingBubble.x
          const dy = y - existingBubble.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < minDistance) {
            validPosition = false
            break
          }
        }
        attempts++
      }

      if (validPosition || attempts >= 50) {
        bubbles.push(new BubbleManager(x, y, size, canvas, (x, y) => {
          setPoppedCount((prev) => {
            const newCount = prev + 1
            if (newCount >= BUBBLE_COUNT) {
              setTimeout(() => onComplete(), 500)
            }
            return newCount
          })
        }))
      }
    }
    bubblesRef.current = bubbles

    // Animation loop
    const animate = (time) => {
      const ctx = canvas.getContext('2d')
      if (!lastFrameRef.current) {
        lastFrameRef.current = time
      }
      const delta = Math.min(32, time - lastFrameRef.current || 16.667)
      lastFrameRef.current = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update all bubbles first
      bubbles.forEach((bubble) => {
        bubble.update(bubbles, delta)
      })

      // Then draw all bubbles
      bubbles.forEach((bubble) => {
        bubble.draw()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', updateDimensions)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      lastFrameRef.current = 0
    }
  }, [])

  const handlePop = useCallback((x, y) => {
    playPopSound()
  }, [playPopSound])

  const handleClick = useCallback((e) => {
    const canvas = containerRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    bubblesRef.current.forEach((bubble) => {
      if (bubble.isPointInside(x, y)) {
        if (bubble.pop(triggerPopSound)) {
          setPoppedCount((prev) => {
            const newCount = prev + 1
            if (newCount >= BUBBLE_COUNT) {
              setTimeout(() => onComplete(), 500)
            }
            return newCount
          })
        }
      }
    })
  }, [onComplete, triggerPopSound])

  const handleTouch = useCallback((e) => {
    e.preventDefault()
    const canvas = containerRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0] || e.changedTouches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    bubblesRef.current.forEach((bubble) => {
      if (bubble.isPointInside(x, y)) {
        if (bubble.pop(triggerPopSound)) {
          setPoppedCount((prev) => {
            const newCount = prev + 1
            if (newCount >= BUBBLE_COUNT) {
              setTimeout(() => onComplete(), 500)
            }
            return newCount
          })
        }
      }
    })
  }, [onComplete, triggerPopSound])

  const overlayStyle = backgroundStyle ? { ...backgroundStyle } : {}

  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-auto"
      style={overlayStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <canvas
        ref={containerRef}
        onClick={handleClick}
        onTouchStart={handleTouch}
        onTouchEnd={handleTouch}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          background: 'transparent'
        }}
      />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
        <p className="text-lg font-bold text-purple-700 bg-white/80 px-4 py-2 rounded-full shadow-lg">
          Pop {BUBBLE_COUNT - poppedCount} bubbles!
        </p>
      </div>
    </motion.div>
  )
}

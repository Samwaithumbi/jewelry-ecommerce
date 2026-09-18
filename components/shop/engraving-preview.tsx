"use client"

import { useEffect, useRef } from "react"

interface EngravingPreviewProps {
  text: string
  font: string
}

export function EngravingPreview({ text, font }: EngravingPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw ring silhouette (simple oval shape)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const outerRadiusX = 120
    const outerRadiusY = 40
    const innerRadiusX = 100
    const innerRadiusY = 25

    // Outer ring
    ctx.beginPath()
    ctx.ellipse(centerX, centerY, outerRadiusX, outerRadiusY, 0, 0, 2 * Math.PI)
    ctx.strokeStyle = "#D4AF37" // Gold color
    ctx.lineWidth = 3
    ctx.stroke()

    // Inner ring
    ctx.beginPath()
    ctx.ellipse(centerX, centerY, innerRadiusX, innerRadiusY, 0, 0, 2 * Math.PI)
    ctx.strokeStyle = "#D4AF37"
    ctx.lineWidth = 2
    ctx.stroke()

    // Fill ring with gradient
    const gradient = ctx.createLinearGradient(centerX - outerRadiusX, centerY, centerX + outerRadiusX, centerY)
    gradient.addColorStop(0, "#F5E6C8")
    gradient.addColorStop(0.5, "#D4AF37")
    gradient.addColorStop(1, "#B8860B")
    
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw engraving text if provided
    if (text) {
      ctx.save()
      
      // Set font based on selection
      let fontFamily = "serif"
      if (font === "script") {
        fontFamily = "'Great Vibes', cursive"
      } else if (font === "block") {
        fontFamily = "'Oswald', sans-serif"
      } else {
        fontFamily = "'Playfair Display', serif"
      }
      
      ctx.font = `italic 16px ${fontFamily}`
      ctx.fillStyle = "#8B6914" // Darker gold for text
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Draw text along the curve of the ring
      const textRadius = (outerRadiusY + innerRadiusY) / 2
      const angleStep = Math.PI / (text.length + 2)
      const startAngle = Math.PI - (text.length * angleStep) / 2

      for (let i = 0; i < text.length; i++) {
        const angle = startAngle + i * angleStep
        const x = centerX + Math.cos(angle) * (outerRadiusX - 20)
        const y = centerY + Math.sin(angle) * textRadius
        
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle - Math.PI / 2)
        ctx.fillText(text[i], 0, 0)
        ctx.restore()
      }

      ctx.restore()
    }
  }, [text, font])

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={250}
        height={100}
        className="border border-primary/10 rounded-lg bg-[#FCFBF9]"
      />
      <p className="text-xs text-muted-foreground">Preview on ring band</p>
    </div>
  )
}

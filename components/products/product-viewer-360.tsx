"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductViewer360Props {
  images: string[];
  className?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number; // degrees per second
}

/**
 * ProductViewer360 — a true 3D image viewer.
 *
 * When multiple images are provided, dragging cycles through them (frame-based).
 * When a single image is provided, dragging rotates it in 3D via CSS perspective
 * transforms (rotateY / rotateX), creating an interactive spin effect.
 *
 * Both modes support zoom (CSS scale) and keyboard navigation.
 */
export const ProductViewer360 = React.memo(function ProductViewer360({
  images,
  className = "",
  autoRotate = false,
  autoRotateSpeed = 30,
}: ProductViewer360Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scale, setScale] = useState(1);
  // 3D rotation angles (used when there's a single image)
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(0);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startRotation = useRef({ x: 0, y: 0 });
  const startIndex = useRef(0);
  const rafId = useRef<number | null>(null);
  const autoRotateRaf = useRef<number | null>(null);

  const totalImages = images.length;
  const isMultiFrame = totalImages > 1;

  // ── Preload images ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!images.length) {
      setIsLoading(false);
      return;
    }

    let loaded = 0;
    const total = images.length;
    setIsLoading(true);

    images.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === total) setIsLoading(false);
      };
      img.src = src;
    });

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (autoRotateRaf.current) cancelAnimationFrame(autoRotateRaf.current);
    };
  }, [images]);

  // ── Auto-rotate (3D spin for single image, frame cycle for multi) ─────────
  useEffect(() => {
    if (!autoRotate || isLoading) return;

    let lastTime: number | null = null;

    const tick = (time: number) => {
      if (lastTime !== null) {
        const dt = (time - lastTime) / 1000;
        if (isMultiFrame) {
          // Advance one frame every (1/speed) seconds
          const interval = 1000 / (autoRotateSpeed / 10);
          if (time - lastTime > interval) {
            setActiveIndex((prev) => (prev + 1) % totalImages);
            lastTime = time;
          }
        } else {
          setRotationY((prev) => prev + autoRotateSpeed * dt);
        }
      } else {
        lastTime = time;
      }
      autoRotateRaf.current = requestAnimationFrame(tick);
    };

    autoRotateRaf.current = requestAnimationFrame(tick);

    return () => {
      if (autoRotateRaf.current) cancelAnimationFrame(autoRotateRaf.current);
    };
  }, [autoRotate, isLoading, isMultiFrame, totalImages, autoRotateSpeed]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  const resetView = useCallback(() => {
    setScale(1);
    setRotationY(0);
    setRotationX(0);
    setActiveIndex(0);
  }, []);

  // ── Pointer events ─────────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isLoading) return;
      isDragging.current = true;
      startPointer.current = { x: e.clientX, y: e.clientY };
      startRotation.current = { x: rotationX, y: rotationY };
      startIndex.current = activeIndex;
      containerRef.current?.setPointerCapture(e.pointerId);

      // Pause auto-rotate while dragging
      if (autoRotateRaf.current) {
        cancelAnimationFrame(autoRotateRaf.current);
        autoRotateRaf.current = null;
      }
    },
    [isLoading, rotationX, rotationY, activeIndex]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current || isLoading) return;

      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - startPointer.current.x;
        const deltaY = e.clientY - startPointer.current.y;

        if (isMultiFrame) {
          // Frame-based rotation
          const sensitivity = 12;
          const deltaIndex = Math.round(deltaX / sensitivity);
          const next = startIndex.current + deltaIndex;
          setActiveIndex(clamp(next, 0, totalImages - 1));
        } else {
          // True 3D CSS rotation
          const sensitivityY = 0.4; // degrees per pixel (horizontal drag → Y-axis)
          const sensitivityX = 0.3; // degrees per pixel (vertical drag → X-axis)
          setRotationY(startRotation.current.y + deltaX * sensitivityY);
          setRotationX(
            clamp(startRotation.current.x - deltaY * sensitivityX, -40, 40)
          );
        }
      });
    },
    [isLoading, isMultiFrame, totalImages]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDragging.current = false;
      containerRef.current?.releasePointerCapture(e.pointerId);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    },
    []
  );

  // ── Keyboard ───────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isLoading) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (isMultiFrame) {
            setActiveIndex((prev) => clamp(prev - 1, 0, totalImages - 1));
          } else {
            setRotationY((prev) => prev - 10);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (isMultiFrame) {
            setActiveIndex((prev) => clamp(prev + 1, 0, totalImages - 1));
          } else {
            setRotationY((prev) => prev + 10);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (!isMultiFrame) setRotationX((prev) => clamp(prev + 5, -40, 40));
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!isMultiFrame) setRotationX((prev) => clamp(prev - 5, -40, 40));
          break;
        case "+":
        case "=":
          e.preventDefault();
          setScale((prev) => clamp(prev + 0.2, 1, 4));
          break;
        case "-":
          e.preventDefault();
          setScale((prev) => clamp(prev - 0.2, 1, 4));
          break;
        case "r":
          resetView();
          break;
      }
    },
    [isLoading, isMultiFrame, totalImages, resetView]
  );

  // ── Mouse wheel zoom ───────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (isLoading) return;
      e.preventDefault();
      const delta = -e.deltaY / 500;
      setScale((prev) => clamp(prev + delta, 1, 4));
    },
    [isLoading]
  );

  // ── Double-click toggle zoom ───────────────────────────────────────────────
  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      setScale(1);
    } else {
      setScale(2);
    }
  }, [scale]);

  // ── Zoom buttons ───────────────────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    setScale((prev) => clamp(prev + 0.3, 1, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => clamp(prev - 0.3, 1, 4));
  }, []);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!images.length) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-slate-100 rounded-xl aspect-square",
          className
        )}
      >
        <p className="text-slate-400">No images available</p>
      </div>
    );
  }

  const isZoomed = scale > 1;

  // Build the CSS transform for the image
  const imageTransform = isMultiFrame
    ? `scale(${scale})`
    : `perspective(800px) rotateY(${rotationY}deg) rotateX(${rotationX}deg) scale(${scale})`;

  return (
    <div className={cn("relative flex flex-col items-center w-full", className)}>
      {/* Main viewer area */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full aspect-square overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-slate-50 to-slate-100",
          "select-none touch-none",
          "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          "cursor-grab active:cursor-grabbing",
          "shadow-lg"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onDoubleClick={handleDoubleClick}
        tabIndex={0}
        role="img"
        aria-label="360° product viewer — drag to rotate, scroll to zoom, arrow keys to navigate"
      >
        {/* Loading skeleton */}
        {isLoading && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-2xl z-10" />
        )}

        {/* Image with 3D transform */}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: imageTransform,
            transformOrigin: "center center",
            transition: isDragging.current ? "none" : "transform 0.15s ease-out",
            willChange: "transform",
          }}
        >
          <img
            src={images[activeIndex]}
            alt={`Product view ${activeIndex + 1} of ${totalImages}`}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
            style={{ opacity: isLoading ? 0 : 1 }}
          />
        </div>

        {/* Drag hint overlay (shown briefly) */}
        {!isLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm opacity-60 animate-pulse">
              ↔ Drag to rotate
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="rounded-full shadow-md bg-white/80 hover:bg-white text-slate-700 backdrop-blur-sm h-9 w-9"
            onClick={(e) => {
              e.stopPropagation();
              zoomIn();
            }}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="rounded-full shadow-md bg-white/80 hover:bg-white text-slate-700 backdrop-blur-sm h-9 w-9"
            onClick={(e) => {
              e.stopPropagation();
              zoomOut();
            }}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          {(isZoomed || rotationY !== 0 || rotationX !== 0) && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="rounded-full shadow-md bg-white/80 hover:bg-white text-slate-700 backdrop-blur-sm h-9 w-9"
              onClick={(e) => {
                e.stopPropagation();
                resetView();
              }}
              aria-label="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Frame counter (multi-frame mode only) */}
        {isMultiFrame && !isZoomed && (
          <div className="absolute bottom-4 left-4 z-20 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
            {activeIndex + 1} / {totalImages}
          </div>
        )}

        {/* Rotation indicator (single image 3D mode) */}
        {!isMultiFrame && !isZoomed && (rotationY !== 0 || rotationX !== 0) && (
          <div className="absolute bottom-4 left-4 z-20 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-mono">
            {Math.round(rotationY % 360)}°
          </div>
        )}
      </div>

      {/* Progress dots (multi-frame mode) */}
      {isMultiFrame && !isZoomed && (
        <div className="mt-4 flex gap-1 justify-center w-full max-w-xs flex-wrap">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === activeIndex ? "bg-slate-800 w-4" : "bg-slate-200 w-1.5"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
});
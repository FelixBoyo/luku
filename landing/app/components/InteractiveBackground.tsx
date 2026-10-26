'use client';

import { useEffect, useRef } from 'react';

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  colorStart: string;
  colorEnd: string;
  speed: number;
  angle: number;
  angleSpeed: number;
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initialize blobs with varied sizes, positions, and drift properties
    const blobs: Blob[] = [
      {
        x: width * 0.25,
        y: height * 0.3,
        vx: 0,
        vy: 0,
        radius: Math.min(width, height) * 0.45,
        colorStart: 'rgba(72, 205, 138, 0.08)',
        colorEnd: 'rgba(72, 205, 138, 0)',
        speed: 0.015,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: 0.002,
      },
      {
        x: width * 0.75,
        y: height * 0.6,
        vx: 0,
        vy: 0,
        radius: Math.min(width, height) * 0.4,
        colorStart: 'rgba(242, 184, 114, 0.06)',
        colorEnd: 'rgba(242, 184, 114, 0)',
        speed: 0.012,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: -0.0015,
      },
      {
        x: width * 0.5,
        y: height * 0.8,
        vx: 0,
        vy: 0,
        radius: Math.min(width, height) * 0.35,
        colorStart: 'rgba(58, 184, 122, 0.05)',
        colorEnd: 'rgba(58, 184, 122, 0)',
        speed: 0.008,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: 0.001,
      },
    ];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      // Update sizes based on new viewport dimensions
      blobs[0].radius = Math.min(width, height) * 0.45;
      blobs[1].radius = Math.min(width, height) * 0.4;
      blobs[2].radius = Math.min(width, height) * 0.35;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw each blob
      blobs.forEach((blob, idx) => {
        // Organic idle movement: update drift angle
        blob.angle += blob.angleSpeed;
        const driftX = Math.cos(blob.angle) * 1.5;
        const driftY = Math.sin(blob.angle) * 1.5;

        let targetX = blob.x;
        let targetY = blob.y;

        if (mouseRef.current.active) {
          // Attract towards mouse at different intensities (index determines delay / speed offset)
          const attractionFactor = 0.02 + idx * 0.015;
          targetX = mouseRef.current.x;
          targetY = mouseRef.current.y;

          // Interpolate current position to target mouse position
          blob.x += (targetX - blob.x) * attractionFactor;
          blob.y += (targetY - blob.y) * attractionFactor;
        } else {
          // If mouse is inactive, let it drift back to organic center orbits
          const homeX = idx === 0 ? width * 0.25 : idx === 1 ? width * 0.75 : width * 0.5;
          const homeY = idx === 0 ? height * 0.3 : idx === 1 ? height * 0.6 : height * 0.8;

          blob.x += (homeX - blob.x) * blob.speed + driftX;
          blob.y += (homeY - blob.y) * blob.speed + driftY;
        }

        // Keep blobs bound inside canvas margins to prevent complete drift off-screen
        const padding = 100;
        if (blob.x < -padding) blob.x = -padding;
        if (blob.x > width + padding) blob.x = width + padding;
        if (blob.y < -padding) blob.y = -padding;
        if (blob.y > height + padding) blob.y = height + padding;

        // Draw radial gradient blob
        const gradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.radius
        );
        gradient.addColorStop(0, blob.colorStart);
        gradient.addColorStop(1, blob.colorEnd);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-shell"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

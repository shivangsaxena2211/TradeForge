"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  size: number;
};

type MousePosition = {
  x: number | null;
  y: number | null;
};

const MAX_PARTICLES = 150;
const PARTICLE_COLOR = "oklch(0.68 0.16 210)";
const LINE_COLOR = "96, 165, 250";
const MOUSE_LINE_COLOR = "59, 130, 246";

function getParticleCount(width: number, height: number): number {
  const count = Math.floor((width * height) / 9000);
  return Math.min(count, MAX_PARTICLES);
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const ctx: CanvasRenderingContext2D = context;
    const surface: HTMLCanvasElement = canvas;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let animationFrameId = 0;
    let particles: Particle[] = [];
    const mouse: MousePosition = { x: null, y: null };

    function resizeCanvas() {
      surface.width = window.innerWidth;
      surface.height = window.innerHeight;
    }

    function initParticles() {
      particles = [];
      const count = reducedMotion
        ? Math.min(40, getParticleCount(surface.width, surface.height))
        : getParticleCount(surface.width, surface.height);

      for (let index = 0; index < count; index += 1) {
        const size = Math.random() * 2 + 1;
        const x =
          Math.random() * (surface.width - size * 4) + size * 2;
        const y =
          Math.random() * (surface.height - size * 4) + size * 2;

        particles.push({
          x,
          y,
          directionX: Math.random() * 0.8 - 0.4,
          directionY: Math.random() * 0.8 - 0.4,
          size,
        });
      }
    }

    function drawParticles() {
      for (const particle of particles) {
        if (particle.x > surface.width || particle.x < 0) {
          particle.directionX = -particle.directionX;
        }

        if (particle.y > surface.height || particle.y < 0) {
          particle.directionY = -particle.directionY;
        }

        if (!reducedMotion) {
          particle.x += particle.directionX;
          particle.y += particle.directionY;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = PARTICLE_COLOR;
        ctx.fill();
      }
    }

    function connectParticles() {
      for (let a = 0; a < particles.length; a += 1) {
        for (let b = a; b < particles.length; b += 1) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = dx * dx + dy * dy;

          if (distance < 15000) {
            const opacity = 1 - distance / 15000;
            ctx.strokeStyle = `rgba(${LINE_COLOR}, ${opacity * 0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }

        if (mouse.x !== null && mouse.y !== null && !reducedMotion) {
          const dxMouse = particles[a].x - mouse.x;
          const dyMouse = particles[a].y - mouse.y;
          const distanceMouse = dxMouse * dxMouse + dyMouse * dyMouse;

          if (distanceMouse < 25000) {
            const opacity = 1 - distanceMouse / 25000;
            ctx.strokeStyle = `rgba(${MOUSE_LINE_COLOR}, ${opacity * 0.6})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, surface.width, surface.height);
      drawParticles();
      connectParticles();
      animationFrameId = window.requestAnimationFrame(animate);
    }

    function handleMouseMove(event: MouseEvent) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    }

    function handleMouseOut() {
      mouse.x = null;
      mouse.y = null;
    }

    function handleResize() {
      resizeCanvas();
      initParticles();
    }

    resizeCanvas();
    initParticles();
    animate();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

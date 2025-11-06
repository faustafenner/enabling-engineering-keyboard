// FireworkCanvas.jsx
import React, { useEffect, useRef } from "react";
import CanvasFirework from "./FireworkEngine";


export default function FireworkCanvas({ fireworks }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const fireworksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Spawn fireworks passed from parent
    fireworks.forEach(({ targetX, targetY }) => {
      fireworksRef.current.push(new CanvasFirework(targetX, targetY));
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      fireworksRef.current = fireworksRef.current.filter((fw) => {
        fw.update();
        fw.draw(ctx);
        return fw.update(); // keep if still active
      });

      if (fireworksRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [fireworks]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}

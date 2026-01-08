/**
 * Animated card component with innovative liquid wave hover effects and magnetic interactions.
 */

import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, MotionValue } from "framer-motion";
import { ReactNode, useRef, useState } from "react";

function GlowTrail({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) {
  const xPercent = useTransform(x, [-0.5, 0.5], [0, 100]);
  const yPercent = useTransform(y, [-0.5, 0.5], [0, 100]);
  const background = useMotionTemplate`radial-gradient(circle at ${xPercent}% ${yPercent}%, rgba(26, 188, 156, 0.15) 0%, transparent 50%)`;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-40"
      style={{ background }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export function AnimatedCard({ children, className = "", delay = 0, onClick }: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 80 });
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 80 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);

    // Create floating particles on hover
    if (isHovered && Math.random() > 0.7) {
      const newParticle = {
        id: Date.now() + Math.random(),
        x: mouseX,
        y: mouseY,
      };
      setParticles((prev) => [...prev.slice(-4), newParticle]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 1000);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
    setParticles([]);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.4, type: "spring", stiffness: 300, damping: 25 }
      }}
      whileTap={{ scale: 0.98 }}
      className={`${className} preserve-3d relative`}
      onClick={onClick}
    >
      {/* Floating particles that follow cursor */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: particle.x,
            top: particle.y,
          }}
          initial={{ 
            scale: 0, 
            opacity: 0.8,
            x: -4,
            y: -4
          }}
          animate={{ 
            scale: [0, 1, 0],
            opacity: [0.8, 0.4, 0],
            y: particle.y - 20,
            x: particle.x + (Math.random() - 0.5) * 20
          }}
          transition={{ 
            duration: 1,
            ease: "easeOut"
          }}
        >
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-lombok-tropical-400 to-lombok-ocean-400 blur-sm" />
        </motion.div>
      ))}
      
      {/* Glow trail effect - menggunakan motion template */}
      {isHovered && (
        <GlowTrail x={mouseXSpring} y={mouseYSpring} />
      )}

      <div className="transform-z-0 relative z-10">
        {children}
      </div>
    </motion.div>
  );
}


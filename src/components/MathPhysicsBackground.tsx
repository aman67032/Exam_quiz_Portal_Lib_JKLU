import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Equation {
  text: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

const MathPhysicsBackground: React.FC = () => {
  const [equations, setEquations] = useState<Equation[]>([]);

  // Math and Physics equations
  const equationList = [
    // Math equations
    'E = mc²',
    'F = ma',
    'a² + b² = c²',
    '∫ f(x)dx',
    'lim(x→∞)',
    'd/dx [f(x)]',
    '∑(n=1 to ∞)',
    'e^(iπ) + 1 = 0',
    '∇²φ = 0',
    '∂²u/∂t² = c²∇²u',
    'f(x) = ax² + bx + c',
    'sin²θ + cos²θ = 1',
    'e^(ln x) = x',
    'logₐ(xy) = logₐ(x) + logₐ(y)',
    '∫₀^∞ e^(-x²) dx = √π/2',
    
    // Physics laws
    'F = G(m₁m₂)/r²',
    'E = hf',
    'PV = nRT',
    'E = ½mv²',
    'F = -kx',
    'I = V/R',
    'P = IV',
    'λ = h/p',
    'ΔE = mc²',
    'v = u + at',
    's = ut + ½at²',
    'v² = u² + 2as',
    'τ = r × F',
    'L = Iω',
    'E = ½Iω²',
    'F = q(E + v × B)',
    '∇ × E = -∂B/∂t',
    '∇ · E = ρ/ε₀',
    'c = λf',
    'n₁sin(θ₁) = n₂sin(θ₂)',
    'ΔS = Q/T',
    'W = ∫ F·ds',
    'P = F/A',
    'ρ = m/V',
    'Q = mcΔT',
    'ΔG = ΔH - TΔS',
    'E = -∇V',
    'B = μ₀I/(2πr)',
    'Φ = BAcos(θ)',
    'ε = -dΦ/dt',
  ];

  useEffect(() => {
    // Generate random positions for equations
    const generateEquations = () => {
      const newEquations: Equation[] = [];
      const numEquations = 40; // Increased number of equations

      for (let i = 0; i < numEquations; i++) {
        newEquations.push({
          text: equationList[Math.floor(Math.random() * equationList.length)],
          x: Math.random() * 100, // Percentage from left
          y: Math.random() * 100, // Percentage from top
          delay: Math.random() * 2,
          duration: 15 + Math.random() * 10, // Animation duration between 15-25s
        });
      }
      setEquations(newEquations);
    };

    generateEquations();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {equations.map((eq, index) => (
        <motion.div
          key={index}
          className="absolute text-gray-500 dark:text-gray-400 text-sm sm:text-base md:text-lg font-mono select-none whitespace-nowrap"
          style={{
            left: `${eq.x}%`,
            top: `${eq.y}%`,
          }}
          initial={{ 
            opacity: 0,
            y: 100,
            rotate: -8 + Math.random() * 16,
            scale: 0.8 + Math.random() * 0.4,
          }}
          animate={{
            opacity: [0, 0.4, 0.4, 0],
            y: [100, -100],
            rotate: [-8 + Math.random() * 16, 8 + Math.random() * 16],
            scale: [0.8 + Math.random() * 0.4, 1 + Math.random() * 0.2],
          }}
          transition={{
            duration: eq.duration,
            delay: eq.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {eq.text}
        </motion.div>
      ))}
      
      {/* Additional static equations for more density */}
      <div className="absolute inset-0">
        {Array.from({ length: 35 }).map((_, i) => {
          const randomEq = equationList[Math.floor(Math.random() * equationList.length)];
          return (
            <motion.div
              key={`static-${i}`}
              className="absolute text-gray-400 dark:text-gray-500 text-sm sm:text-base font-mono select-none whitespace-nowrap"
              style={{
                left: `${3 + (i * 2.8)}%`,
                top: `${2 + (i % 5) * 20}%`,
              }}
              initial={{
                rotate: -12 + Math.random() * 24,
                opacity: 0.25,
              }}
              animate={{
                rotate: [-12 + Math.random() * 24, 12 + Math.random() * 24],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 20 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {randomEq}
            </motion.div>
          );
        })}
      </div>
      
      {/* Exam-related decorative elements */}
      <div className="absolute inset-0">
        {['EXAM', 'TEST', 'QUIZ', 'FINAL'].map((text, i) => (
          <motion.div
            key={`exam-${i}`}
            className="absolute text-gray-300 dark:text-gray-600 text-7xl md:text-9xl font-bold select-none"
            style={{
              left: `${10 + i * 22}%`,
              top: `${15 + (i % 2) * 55}%`,
            }}
            initial={{
              rotate: -15 + i * 10,
              opacity: 0.15,
            }}
            animate={{
              rotate: [-15 + i * 10, -10 + i * 10],
              opacity: [0.12, 0.18, 0.12],
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {text}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MathPhysicsBackground;


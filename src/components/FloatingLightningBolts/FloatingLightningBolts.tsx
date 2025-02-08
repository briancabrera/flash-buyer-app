import React from 'react';
import { motion } from 'framer-motion';
import './FloatingLightningBolts.scss';

const FloatingLightningBolts: React.FC = () => {
  const bolts = Array(50).fill(0).map((_, i) => ({
    id: i,
    size: Math.random() * 16 + 8,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  return (
    <div className="floating-bolts">
      {bolts.map((bolt) => (
        <motion.div
          key={bolt.id}
          className="bolt"
          style={{
            fontSize: bolt.size,
            left: `${bolt.x}%`,
            top: `${bolt.y}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
            y: [0, Math.random() * 60 - 30, 0],
            x: [0, Math.random() * 40 - 20, 0],
          }}
          transition={{
            duration: bolt.duration,
            delay: bolt.delay,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          ⚡️
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingLightningBolts;
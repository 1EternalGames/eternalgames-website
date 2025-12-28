// app/celestial-almanac/page.tsx
'use client';

import React from 'react';
import SpaceBackground from '@/components/ui/SpaceBackground';
import { motion } from 'framer-motion';

export default function CelestialAlmanacPage() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Background Layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <SpaceBackground />
      </div>

      {/* Content Layer */}
      <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          color: '#fff',
          paddingBottom: '10vh' // Visual balance
      }}>
          <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                  fontSize: 'clamp(4rem, 10vw, 8rem)',
                  fontWeight: 900,
                  margin: 0,
                  textShadow: '0 0 40px rgba(0, 255, 240, 0.3)',
                  fontFamily: 'var(--font-heading)'
              }}
          >
              قريباً
          </motion.h1>
          
          <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{
                  fontSize: '1.8rem',
                  color: 'var(--text-secondary)',
                  marginTop: '2.5rem',
                  fontFamily: 'var(--font-main)'
              }}
          >
              يأتيكم في قادم الأيام...
          </motion.p>
      </div>
    </div>
  );
}
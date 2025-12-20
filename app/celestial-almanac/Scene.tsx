// app/celestial-almanac/Scene.tsx

import React, { useRef, useMemo, Suspense, useCallback, useState } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Points, PointMaterial, OrbitControls, Line, Text } from '@react-three/drei';
import { EffectComposer, Bloom, Selection, Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { THEME_CONFIG, OrbitalBodyData, ScreenPosition, Placement, OrbitalSystemData } from './config';
import { ConstellationSettings } from '@/components/constellation/ConstellationControlPanel';

// Background starfield component (repurposed directly from Constellation)
const StarLayer = ({ count, radius, size, opacity, color }: { count: number, radius: number, size: number, opacity: number, color: string }) => {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let r = radius + Math.random() * 2; let theta = Math.random() * 2 * Math.PI; let phi = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)], i * 3);
    }
    return pos;
  }, [count, radius]);
  return <Points positions={positions}><PointMaterial transparent color={color} size={size} sizeAttenuation depthWrite={false} opacity={opacity} /></Points>;
};

const BackgroundStarfield = ({ themeColors, countMultiplier }: { themeColors: typeof THEME_CONFIG.dark, countMultiplier: number }) => {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state, delta) => { if (ref.current) ref.current.rotation.y -= delta / 60; });
  return (
    <group ref={ref}>
      <StarLayer count={Math.floor(1500 * countMultiplier)} radius={8} size={0.015} opacity={0.7} color={themeColors.bgStarColor} />
      <StarLayer count={Math.floor(1000 * countMultiplier)} radius={12} size={0.01} opacity={0.5} color={themeColors.bgStarColor} />
    </group>
  );
};

// Interactive game release "planet" component
const ReleasePlanet = ({ body, colors, onHover, onClick }: {
  body: OrbitalBodyData, colors: typeof THEME_CONFIG.dark,
  onHover: (body: OrbitalBodyData | null) => void,
  onClick: (body: OrbitalBodyData) => void
}) => {
  const ref = useRef<THREE.Mesh>(null!);
  const [isHovered, setIsHovered] = useState(false);

  useFrame(() => {
    ref.current.scale.lerp(new THREE.Vector3().setScalar(isHovered ? 1.8 : 1), 0.2);
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    setIsHovered(true);
    onHover(body);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
    setIsHovered(false);
    onHover(null);
  };

  return (
    <mesh ref={ref} position={body.position} onClick={(e) => { e.stopPropagation(); onClick(body); }} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial color={isHovered ? colors.hoverStarColor : colors.starColor} toneMapped={false} />
    </mesh>
  );
};

// Main Scene Logic
function InteractiveLayer({ orbitalData, themeColors, setActiveStar, settings }: any) {
  const [hoveredBody, setHoveredBody] = useState<OrbitalBodyData | null>(null);
  const { camera, gl } = useThree();

  const handleBodyClick = useCallback((body: OrbitalBodyData) => {
    const canvasRect = gl.domElement.getBoundingClientRect();
    const vec = new THREE.Vector3().copy(body.position);
    vec.project(camera);
    const x = (vec.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left;
    const y = (vec.y * -0.5 + 0.5) * canvasRect.height + canvasRect.top;
    const placement: Placement = y > window.innerHeight / 2 ? 'above' : 'below';
    let finalX = x;
    const cardWidth = 300; const padding = 20;
    if (finalX < cardWidth / 2 + padding) finalX = cardWidth / 2 + padding;
    if (finalX > window.innerWidth - cardWidth / 2 - padding) finalX = window.innerWidth - cardWidth / 2 - padding;
    setActiveStar(body, { top: y, left: finalX, placement });
  }, [camera, gl.domElement, setActiveStar]);

  const controlsRef = useRef<any>(null);
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !hoveredBody;
      controlsRef.current.update();
    }
  });

  const { bloomIntensity } = settings;
  const isBloomEnabled = bloomIntensity > 0;

  return (
    <>
      {isBloomEnabled ? (
        <Selection>
          <EffectComposer autoClear={false} frameBufferType={THREE.HalfFloatType} multisampling={0}>
            <Bloom intensity={bloomIntensity} luminanceThreshold={0.1} mipmapBlur luminanceSmoothing={0.2} radius={0.7} />
          </EffectComposer>
          <Select enabled>
            <mesh>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial color={themeColors.sunColor} emissive={themeColors.sunColor} emissiveIntensity={3} toneMapped={false} />
            </mesh>
          </Select>
        </Selection>
      ) : (
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial color={themeColors.sunColor} toneMapped={false} />
        </mesh>
      )}

      {orbitalData.map((monthSystem: OrbitalSystemData) => {
        const circlePoints = useMemo(() => {
          const points = [];
          for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(angle) * monthSystem.radius, Math.sin(angle) * monthSystem.radius, 0));
          }
          return points;
        }, [monthSystem.radius]);

        return (
          <group key={monthSystem.month}>
            <Line points={circlePoints} color={themeColors.orbitColor} lineWidth={1} />
            <Text
              position={[monthSystem.radius + 0.2, 0, 0]}
              color={themeColors.orbitColor}
              fontSize={0.15}
              anchorX="left"
              anchorY="middle"
            >
              {monthSystem.month}
            </Text>
            {monthSystem.bodies.map(body => (
              <ReleasePlanet key={body.id} body={body} colors={themeColors} onHover={setHoveredBody} onClick={handleBodyClick} />
            ))}
          </group>
        );
      })}

      <OrbitControls
        ref={controlsRef}
        enableZoom
        autoRotate={true}
        autoRotateSpeed={0.1}
        minDistance={3}
        maxDistance={15}
        zoomSpeed={0.5}
        enablePan={false}
      />
    </>
  );
}

// MODIFIED: Added isFeatureLive prop
export const Scene = ({ orbitalData, themeColors, setActiveStar, settings, isFeatureLive }: any) => {
  return (
    <Suspense fallback={null}>
      <color attach="background" args={[themeColors.bgColor]} />
      <ambientLight intensity={0.8} />
      <BackgroundStarfield themeColors={themeColors} countMultiplier={settings.starCountMultiplier} />
      {/* MODIFIED: Conditionally render the InteractiveLayer */}
      {isFeatureLive && (
        <InteractiveLayer orbitalData={orbitalData} themeColors={themeColors} setActiveStar={setActiveStar} settings={settings} />
      )}
    </Suspense>
  );
};



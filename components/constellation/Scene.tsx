// components/constellation/Scene.tsx
import React, { useRef, useMemo, Suspense, useCallback, useState } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Points, PointMaterial, OrbitControls, Tube, Line, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Selection, Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { THEME_CONFIG, SIZES, StarData, ScreenPosition, Placement, getStarSize, StarActionType } from './config';
import { ConstellationSettings } from './ConstellationControlPanel';
import { motion, AnimatePresence } from 'framer-motion';

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

const InteractiveStar = ({ star, color, isHovered, onHover, onClick }: {
    star: StarData, color: string, isHovered: boolean,
    onHover: (star: StarData | null) => void,
    onClick: (star: StarData) => void
}) => {
    const ref = useRef<THREE.Mesh>(null!);
    const size = useMemo(() => getStarSize(star), [star]);
    useFrame(() => { ref.current.scale.lerp(new THREE.Vector3().setScalar(isHovered ? 1.5 : 1), 0.2); });
    const handlePointerOver = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; onHover(star); };
    const handlePointerOut = () => { onHover(null); document.body.style.cursor = 'auto'; };
    return (
        <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onClick(star); }} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
            <sphereGeometry args={[size, 16, 16]} />
            <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
    );
};

const BackgroundStarfield = ({ themeColors, countMultiplier }: { themeColors: typeof THEME_CONFIG.dark, countMultiplier: number }) => {
    const ref = useRef<THREE.Group>(null!);
    useFrame((state, delta) => { if (ref.current) ref.current.rotation.y -= delta / 45; });
    return (
        <group ref={ref}>
            <StarLayer count={Math.floor(1500 * countMultiplier)} radius={4} size={0.015} opacity={0.7} color={themeColors.bgStarColor} />
            <StarLayer count={Math.floor(1000 * countMultiplier)} radius={6} size={0.01} opacity={0.5} color={themeColors.bgStarColor} />
            <StarLayer count={Math.floor(500 * countMultiplier)} radius={8} size={0.008} opacity={0.3} color={themeColors.bgStarColor} />
        </group>
    );
};

const createUIShareIconGeometry = () => {
    const scale = 0.05;
    const center = new THREE.Vector2(12, 12);
    const createCenteredShapeFromPoints = (points: {x: number, y: number}[]) => {
        const shape = new THREE.Shape();
        const vecs = points.map(p => new THREE.Vector2(p.x, p.y).sub(center).multiplyScalar(scale));
        shape.moveTo(vecs[0].x, -vecs[0].y);
        for (let i = 1; i < vecs.length; i++) shape.lineTo(vecs[i].x, -vecs[i].y);
        shape.closePath();
        return shape;
    };
    const createCircleShape = ({x, y, r}: {x: number, y: number, r: number}) => {
        const shape = new THREE.Shape();
        const centerVec = new THREE.Vector2(x, y).sub(center).multiplyScalar(scale);
        shape.absarc(centerVec.x, -centerVec.y, r * scale, 0, Math.PI * 2, false);
        return shape;
    };
    const circle1Shape = createCircleShape({ x: 18, y: 5, r: 3 });
    const circle2Shape = createCircleShape({ x: 6, y: 12, r: 3 });
    const circle3Shape = createCircleShape({ x: 18, y: 19, r: 3 });
    const line1Points = [{ x: 8.59, y: 13.51 }, { x: 15.42, y: 17.44 }, { x: 14.42, y: 19.18 }, { x: 7.59, y: 15.25 }];
    const line2Points = [{ x: 8.59, y: 10.49 }, { x: 9.59, y: 12.23 }, { x: 16.42, y: 8.30 }, { x: 15.42, y: 6.56 }];
    const line1Shape = createCenteredShapeFromPoints(line1Points);
    const line2Shape = createCenteredShapeFromPoints(line2Points);
    return new THREE.ShapeGeometry([circle1Shape, circle2Shape, circle3Shape, line1Shape, line2Shape]);
};

const createUIHeartGeometry = () => {
    const shape = new THREE.Shape();
    const scale = 0.05;
    const center = new THREE.Vector2(12, 12);
    const transform = (x: number, y: number) => {
        const v = new THREE.Vector2(x, y).sub(center);
        return { x: v.x * scale, y: -v.y * scale };
    };
    let p0 = transform(12, 21); shape.moveTo(p0.x, p0.y);
    let p1 = transform(12, 21), p2 = transform(5.8, 16.4), p3 = transform(2.8, 12.5); shape.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    p1 = transform(0.9, 9.7); p2 = transform(2.5, 5); p3 = transform(6.7, 4.5); shape.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    p1 = transform(8.6, 4.3); p2 = transform(10.5, 5.2); p3 = transform(12, 6.7); shape.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    p1 = transform(13.5, 5.2); p2 = transform(15.4, 4.3); p3 = transform(17.3, 4.5); shape.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    p1 = transform(21.5, 5); p2 = transform(23.1, 9.7); p3 = transform(21.2, 12.5); shape.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    p1 = transform(18.2, 16.4); p2 = transform(12, 21); p3 = transform(12, 21); shape.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    return new THREE.ShapeGeometry(shape);
};

const createUIBookmarkGeometry = () => {
    const scale = 0.05;
    const center = new THREE.Vector2(12, 12);
    const points = [
        new THREE.Vector2(6, 2), new THREE.Vector2(4, 4), new THREE.Vector2(4, 22),
        new THREE.Vector2(12, 17), new THREE.Vector2(20, 22), new THREE.Vector2(20, 4),
        new THREE.Vector2(18, 2),
    ];
    const transformedPoints = points.map(p => {
        const v = p.clone().sub(center);
        return new THREE.Vector2(v.x * scale, -v.y * scale);
    });
    return new THREE.ShapeGeometry(new THREE.Shape().setFromPoints(transformedPoints));
};

const ICON_GEOMETRIES = {
    heart: createUIHeartGeometry(),
    bookmark: createUIBookmarkGeometry(),
    share: createUIShareIconGeometry(),
    comment: new THREE.ShapeGeometry(new THREE.Shape().setFromPoints([
        new THREE.Vector2(-0.6, 0.4), new THREE.Vector2(0.6, 0.4), new THREE.Vector2(0.6, -0.2),
        new THREE.Vector2(0.1, -0.2), new THREE.Vector2(0, -0.4), new THREE.Vector2(-0.1, -0.2),
        new THREE.Vector2(-0.6, -0.2),
    ]))
};

const ActionOrbit3D = ({ actions }: { actions: StarActionType[] }) => {
    const { camera } = useThree();
    const groupRef = useRef<THREE.Group>(null!);
    useFrame(() => { if (groupRef.current) groupRef.current.quaternion.copy(camera.quaternion); });
    const radius = 0.3;
    const iconScale = 0.085;

    return (
        <group ref={groupRef}>
            {actions.map((action, index) => {
                const angle = (index / actions.length) * Math.PI * 2;
                const iconPosition = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
                const geometryKey = action === 'like' ? 'heart' : action;
                const geometry = ICON_GEOMETRIES[geometryKey];
                return (
                    <group key={action}>
                        <Tube renderOrder={0} args={[new THREE.LineCurve3(new THREE.Vector3(0,0,0), iconPosition), 16, 0.002, 8, false]}>
                            <meshBasicMaterial color="white" toneMapped={false} />
                        </Tube>
                        <mesh renderOrder={1} position={iconPosition} geometry={geometry} scale={iconScale}>
                            <meshBasicMaterial color={THEME_CONFIG.dark.reviewColor} toneMapped={false} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};

const UserStarPoints = ({ stars, themeColors, hoveredStar, setHoveredStar, setActiveStar, alwaysShowOrbits }: {
    stars: StarData[], themeColors: typeof THEME_CONFIG.dark, hoveredStar: StarData | null,
    setHoveredStar: (star: StarData | null) => void,
    setActiveStar: (star: StarData, position: ScreenPosition) => void,
    alwaysShowOrbits: boolean
}) => {
    const { camera, gl } = useThree();
    const handleStarClick = useCallback((star: StarData) => {
        const canvasRect = gl.domElement.getBoundingClientRect();
        const vec = new THREE.Vector3().copy(star.position);
        vec.project(camera);
        const x = (vec.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left;
        const y = (vec.y * -0.5 + 0.5) * canvasRect.height + canvasRect.top;
        const placement: Placement = y > window.innerHeight / 2 ? 'above' : 'below';
        let finalX = x;
        const cardWidth = 300;
        const padding = 20;
        if (finalX < cardWidth / 2 + padding) finalX = cardWidth / 2 + padding;
        if (finalX > window.innerWidth - cardWidth / 2 - padding) finalX = window.innerWidth - cardWidth / 2 - padding;
        setActiveStar(star, { top: y, left: finalX, placement });
    }, [camera, gl.domElement, setActiveStar]);
    return (
        <group>
            {stars.map(star => {
                const colorKey = `${star.content._type}Color` as keyof typeof themeColors;
                const isHovered = hoveredStar?.id === star.id;
                return (
                    <group key={star.id || star.content._id} position={star.position}>
                        <InteractiveStar star={star} color={themeColors[colorKey]} isHovered={isHovered} onHover={setHoveredStar} onClick={handleStarClick} />
                        {(alwaysShowOrbits || isHovered) && star.actions.length > 0 && (
                            <ActionOrbit3D actions={star.actions} />
                        )}
                    </group>
                );
            })}
        </group>
    );
};

const ConstellationPath = ({ pathPoints, color, thickness }: { pathPoints: THREE.Vector3[], color: string, thickness: number }) => {
    return <Line points={pathPoints} color={color} lineWidth={thickness} />;
};

const HoverContext = ({ hoveredStar, alwaysShowOrbits }: { hoveredStar: StarData, alwaysShowOrbits: boolean }) => {
    return (
        <Html position={hoveredStar.position}>
            <div style={{ position: 'relative', pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}>
                {!alwaysShowOrbits && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' as const }}
                        style={{
                            position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
                            background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '0.5rem 1rem',
                            borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '1.4rem',
                            fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', zIndex: 10000,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}
                    >
                        <p style={{ margin: 0, fontWeight: 600 }}>{hoveredStar.content.title}</p>
                        <p style={{ margin: 0, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{hoveredStar.content._type}</p>
                    </motion.div>
                )}
            </div>
        </Html>
    );
};

function InteractiveLayer({ chronologicalStars, themeColors, setActiveStar, settings, isMobile }: any) {
    const [hoveredStar, setHoveredStar] = useState<StarData | null>(null);
    const { bloomIntensity, alwaysShowOrbits, flawlessPathThickness } = settings;
    const isBloomEnabled = bloomIntensity > 0;

    const controlsRef = useRef<any>(null);
    useFrame(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = !hoveredStar;
            controlsRef.current.update();
        }
    });

    return (
        <>
            <AnimatePresence>{hoveredStar && <HoverContext hoveredStar={hoveredStar} alwaysShowOrbits={alwaysShowOrbits} />}</AnimatePresence>
            {isBloomEnabled ? (
                <Selection>
                    <EffectComposer autoClear={false} frameBufferType={THREE.HalfFloatType} multisampling={0}>
                        <Bloom intensity={bloomIntensity} luminanceThreshold={0.1} mipmapBlur luminanceSmoothing={0.2} radius={0.7} />
                    </EffectComposer>
                    {chronologicalStars.length > 0 && (
                        <Select enabled>
                            <UserStarPoints stars={chronologicalStars} themeColors={themeColors} hoveredStar={hoveredStar} setHoveredStar={setHoveredStar} setActiveStar={setActiveStar} alwaysShowOrbits={alwaysShowOrbits} />
                            <ConstellationPath pathPoints={chronologicalStars.map((s: StarData) => s.position)} color={themeColors.pathColor} thickness={flawlessPathThickness} />
                        </Select>
                    )}
                </Selection>
            ) : (
                chronologicalStars.length > 0 && (
                    <>
                        <UserStarPoints stars={chronologicalStars} themeColors={themeColors} hoveredStar={hoveredStar} setHoveredStar={setHoveredStar} setActiveStar={setActiveStar} alwaysShowOrbits={alwaysShowOrbits} />
                        <ConstellationPath pathPoints={chronologicalStars.map((s: StarData) => s.position)} color={themeColors.pathColor} thickness={flawlessPathThickness} />
                    </>
                )
            )}
            <OrbitControls
                ref={controlsRef}
                enableZoom
                autoRotate={true}
                autoRotateSpeed={0.15}
                minDistance={2.5}
                maxDistance={isMobile ? 20 : 15} // MODIFIED: Increased maxDistance for both views
                zoomSpeed={0.5}
            />
        </>
    );
}

interface SceneProps {
    chronologicalStars: StarData[];
    themeColors: typeof THEME_CONFIG.dark;
    setActiveStar: (star: StarData, position: ScreenPosition) => void;
    settings: ConstellationSettings;
    isMobile: boolean;
}

export const Scene = ({ chronologicalStars, themeColors, setActiveStar, settings, isMobile }: SceneProps) => {
    return (
        <Suspense fallback={null}>
            <color attach="background" args={[themeColors.bgColor]} />
            <ambientLight intensity={0.5} />
            <BackgroundStarfield themeColors={themeColors} countMultiplier={settings.starCountMultiplier} />
            <InteractiveLayer
                chronologicalStars={chronologicalStars}
                themeColors={themeColors}
                setActiveStar={setActiveStar}
                settings={settings}
                isMobile={isMobile}
            />
        </Suspense>
    );
};
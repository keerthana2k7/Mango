import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SimulationStatus } from '../../types';

interface CameraCarriage3DProps {
  position: [number, number, number]; // [x, y, z] in Three.js coordinates
  simulationStatus: SimulationStatus | null;
}

export const CameraCarriage3D: React.FC<CameraCarriage3DProps> = ({
  position,
  simulationStatus,
}) => {
  const isCapturing =
    simulationStatus?.is_capturing || simulationStatus?.status === 'CAPTURING';
  const isMoving =
    simulationStatus?.status === 'MOVING' || simulationStatus?.status === 'CAPTURING';
  const direction =
    simulationStatus?.direction ||
    (simulationStatus?.current_row && simulationStatus.current_row % 2 === 1
      ? 'FORWARD'
      : 'BACKWARD');

  const coneRef = useRef<THREE.Mesh>(null);
  const scanRingRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.PointLight>(null);

  // Active scan animation loop
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Scanning Laser Cone Animation
    if (coneRef.current && isCapturing) {
      const s = 1.0 + Math.sin(t * 10) * 0.12;
      coneRef.current.scale.set(s, 1, s);
    }

    // 2. Sweeping Laser Scan Ring Animation (moving down canopy)
    if (scanRingRef.current && isCapturing) {
      const scanY = -1.5 - ((Math.sin(t * 4) + 1) / 2) * 2.5;
      scanRingRef.current.position.y = scanY;
      const ringScale = 1.0 + ((Math.sin(t * 4) + 1) / 2) * 0.8;
      scanRingRef.current.scale.set(ringScale, ringScale, 1);
    }

    // 3. Flashing Beacon LED
    if (beaconRef.current) {
      beaconRef.current.intensity = isCapturing
        ? 3.0 + Math.sin(t * 14) * 2.0
        : isMoving
        ? 1.8 + Math.sin(t * 5) * 0.8
        : 1.0;
    }
  });

  const headingRotation = direction === 'FORWARD' ? 0 : Math.PI;

  return (
    <group position={position} rotation={[0, headingRotation, 0]}>
      {/* ================= 1. Gantry Trolley Chassis ================= */}
      {/* Main Overhead Trolley Crossbeam */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[2.2, 0.45, 1.2]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Heavy-Duty Gantry Support Arms */}
      <mesh position={[-0.85, 0.4, 0]} castShadow>
        <boxGeometry args={[0.2, 0.6, 1.1]} />
        <meshStandardMaterial color="#1E293B" metalness={0.9} />
      </mesh>
      <mesh position={[0.85, 0.4, 0]} castShadow>
        <boxGeometry args={[0.2, 0.6, 1.1]} />
        <meshStandardMaterial color="#1E293B" metalness={0.9} />
      </mesh>

      {/* 4 Steel Rail Wheels / Bogies Mounted on Track */}
      {/* Front-North Wheel */}
      <mesh position={[-0.85, 0.55, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.15, 16]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.2} metalness={0.95} />
      </mesh>
      {/* Front-South Wheel */}
      <mesh position={[-0.85, 0.55, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.15, 16]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.2} metalness={0.95} />
      </mesh>
      {/* Rear-North Wheel */}
      <mesh position={[0.85, 0.55, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.15, 16]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.2} metalness={0.95} />
      </mesh>
      {/* Rear-South Wheel */}
      <mesh position={[0.85, 0.55, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.15, 16]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.2} metalness={0.95} />
      </mesh>

      {/* ================= 2. Robotic Camera Housing & Sensor ================= */}
      {/* Camera Main Body (Emerald Agro-Tech Finish) */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 0.8, 0.85]} />
        <meshStandardMaterial color="#064E3B" roughness={0.35} metalness={0.4} />
      </mesh>

      {/* Front Camera Sensor Hood */}
      <mesh position={[0.4, -0.4, 0]} castShadow>
        <boxGeometry args={[0.3, 0.5, 0.6]} />
        <meshStandardMaterial color="#022C22" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Downward Multi-spectral Camera Lens Turret */}
      <mesh position={[0, -0.9, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.35, 0.3, 20]} />
        <meshStandardMaterial color="#022C22" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Glass Lens Element */}
      <mesh position={[0, -1.06, 0]}>
        <circleGeometry args={[0.26, 20]} />
        <meshStandardMaterial color="#34D399" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* ================= 3. Status Beacon & Live Light ================= */}
      {/* Flashing Top Beacon LED */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.25, 14]} />
        <meshBasicMaterial color={isCapturing ? '#F59E0B' : '#10B981'} />
      </mesh>
      <pointLight
        ref={beaconRef}
        position={[0, 0.8, 0]}
        color={isCapturing ? '#F59E0B' : '#10B981'}
        distance={12}
        intensity={2.0}
      />

      {/* Downward Illumination Spot Light */}
      <spotLight
        position={[0, -1.1, 0]}
        target-position={[0, -5.5, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={isCapturing ? 4.0 : 1.2}
        color={isCapturing ? '#F59E0B' : '#FFFFFF'}
        distance={10}
      />

      {/* ================= 4. Volumetric Laser Scanning Animation ================= */}
      {isCapturing && (
        <group position={[0, -1.1, 0]}>
          {/* Volumetric Glowing Scanning Laser Cone */}
          <mesh
            ref={coneRef}
            position={[0, -2.4, 0]}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[2.8, 4.8, 28, 1, true]} />
            <meshBasicMaterial
              color="#F59E0B"
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Sweeping Laser Scan Ring */}
          <mesh ref={scanRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 2.2, 32]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>

          {/* Core Laser Beam Center Line */}
          <mesh position={[0, -2.4, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 4.8, 8]} />
            <meshBasicMaterial color="#FDE68A" />
          </mesh>
        </group>
      )}
    </group>
  );
};
